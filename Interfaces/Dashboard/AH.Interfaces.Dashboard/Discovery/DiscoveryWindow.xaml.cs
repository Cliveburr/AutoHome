using AH.Protocol.Library;
using AH.Protocol.Library.Connection;
using AH.Protocol.Library.Messages;
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
        private Dictionary<int, ModuleView.ModuleViewWindow> _modules;

        public DiscoveryWindow()
        {
            InitializeComponent();

            _modules = new Dictionary<int, ModuleView.ModuleViewWindow>();

            SetContext();
            SetPorts_Click(null, null);
        }

        private void SetContext()
        {
            _context = new DiscoveryContext
            {
                SendPort = 15555,
                ReceivePort = 15556,
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

            _connection = new UdpConnection();
            _connection.OnUdpReceived += _connection_OnUdpReceived;
            _connection.StartSender(_context.SendPort);
            _connection.StartReceiver(_context.ReceivePort);
        }

        private void _connection_OnUdpReceived(IPAddress address, Message message)
        {
            if (message.Port != PortType.AutoHome || message.Msg != (byte)AutoHomeMessageType.Pong)
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
            try
            {
                if (dgModules.SelectedItems.Count != 1)
                {
                    throw new Exception("Need to select one module to connect!");
                }

                var module = dgModules.SelectedItem as DiscoveryModuleModel;

                OpenWindowForUID(module);
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private void OpenWindowForUID(DiscoveryModuleModel module)
        {
            if (_modules.ContainsKey(module.UID))
            {
                _modules[module.UID].Activate();
            }
            else
            {
                var newWindow = new ModuleView.ModuleViewWindow(_context.ReceivePort, module);
                _modules.Add(module.UID, newWindow);
                newWindow.Closed += new EventHandler((sender, e) => _modules.Remove(module.UID));
                newWindow.Show();
            }
        }
    }
}