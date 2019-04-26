using AH.Protocol.Library;
using AH.Protocol.Library.Connection;
using AH.Protocol.Library.Messages.AutoHome;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace AH.Interfaces.Dashboard.Discovery
{
    public partial class DiscoveryWindow : Window
    {
        private UdpConnection _connection;
        private DiscoveryContext _context;

        public DiscoveryWindow()
        {
            InitializeComponent();

            SetContext();
            SetPorts_Click(null, null);
        }

        private void SetContext()
        {
            _context = new DiscoveryContext
            {
                SendPort = 30,
                ReceivePort = 31,
                ModuleList = new ObservableCollection<DiscoveryModuleModel>()
            };
            DataContext = _context;
        }

        private void SetPorts_Click(object sender, RoutedEventArgs e)
        {
            if (_connection != null)
            {
                _connection.OnUdpReceived -= _connection_OnUdpReceived;
                _connection.Dispose();
            }

            _connection = new UdpConnection(_context.SendPort, _context.ReceivePort);
            _connection.OnUdpReceived += _connection_OnUdpReceived;
        }

        private void _connection_OnUdpReceived(IPAddress address, Message message)
        {
            if (message.Port != 1 || message.Msg != 2)
                return;

            var content = message.ReadContent<PongResponse>();

            if (!content.IsValid)
                return;

            Dispatcher.Invoke(() =>
            {
                _context.ModuleList.Add(new DiscoveryModuleModel
                {
                    UID = message.UID,
                    Alias = content.Alias,
                    ModuleType = content.ModuleType.ToString(),
                    Ip = address.ToString()
                });
            });
        }

        private void Ping_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                _context.ModuleList.Clear();
                _connection.SendUdp(IPAddress.Broadcast, new Message(0, new PingRequest()));
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private void Connect_Click(object sender, RoutedEventArgs e)
        {

        }
    }
}