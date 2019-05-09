using AH.Interfaces.Dashboard.Discovery;
using AH.Protocol.Library.Connection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace AH.Interfaces.Dashboard.ModuleView
{
    public partial class ModuleViewWindow : Window
    {
        private DiscoveryModuleModel _module;
        private TcpConnection _connection;

        public ModuleViewWindow(int port, DiscoveryModuleModel module)
        {
            InitializeComponent();

            _module = module;

            SetConnection(module.UID, port);
            SetFrames();
        }

        private void SetConnection(int UID, int port)
        {
            _connection = new TcpConnection(UID);
            _connection.StartSender(port, System.Net.IPAddress.Parse(_module.Ip));
        }

        private void SetFrames()
        {
            frAutoHome.Navigate(new AutoHome.AutoHomePage(_connection));
        }

        private void Window_Closed(object sender, EventArgs e)
        {

        }
    }
}