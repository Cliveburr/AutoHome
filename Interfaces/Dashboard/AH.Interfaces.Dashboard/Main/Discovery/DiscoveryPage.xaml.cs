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

namespace AH.Interfaces.Dashboard.Main.Discovery
{
    public partial class DiscoveryPage : Page
    {
        private DiscoveryContext _context;
        private Dictionary<int, ModuleView.ModuleViewWindow> _modules;

        public DiscoveryPage()
        {
            InitializeComponent();

            _modules = new Dictionary<int, ModuleView.ModuleViewWindow>();

            SetContext();
            SetConnection();
        }

        private void SetContext()
        {
            _context = new DiscoveryContext
            {
                ModuleList = new ObservableCollection<DiscoveryModuleModel>()
            };
            DataContext = _context;
        }

        private void SetConnection()
        {
            App.Instance.Connection.OnUdpReceived += AppConnection_OnUdpReceived;
        }

        private void AppConnection_OnUdpReceived(IPAddress address, Message message)
        {
            if (message.Port != PortType.AutoHome || message.Msg != (byte)AutoHomeMessageType.PongResponse)
            {
                return;
            }

            var content = message.ReadContent<PongResponse>();
            if (content.Check != "PONG")
            {
                return;
            }

            Dispatcher.Invoke(() =>
            {
                _context.ModuleList.Add(new DiscoveryModuleModel
                {
                    UID = message.From_UID,
                    Alias = content.Alias,
                    ModuleType = content.ModuleType,
                    IpString = address.ToString(),
                    Ip = address
                });
            });
        }

        private void Ping_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                _context.ModuleList.Clear();
                App.Instance.Connection.SendBroadcast(new PingRequest());
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
            App.Instance.Selected = module;

            //if (_modules.ContainsKey(module.UID))
            //{
            //    _modules[module.UID].Activate();
            //}
            //else
            //{
            //    var newWindow = new ModuleView.ModuleViewWindow(new ModuleView.ModuleViewConnector
            //    {
            //        UID = module.UID,
            //        SendPort = _context.SendPort,
            //        ReceivePort = _context.ReceivePort,
            //        Ip = module.Ip
            //    });
            //    _modules.Add(module.UID, newWindow);
            //    newWindow.Closed += new EventHandler((sender, e) => _modules.Remove(module.UID));
            //    newWindow.Show();
            //}
        }

        public void Modules_DoubleClick(object sender, RoutedEventArgs e)
        {
            Connect_Click(sender, e);
        }
    }
}