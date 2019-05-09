using AH.Protocol.Library.Connection;
using AH.Protocol.Library.Messages;
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
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace AH.Interfaces.Dashboard.ModuleView.AutoHome
{
    public partial class AutoHomePage : Page
    {
        private TcpConnection _connection;
        private AutoHomeContext _context;

        public AutoHomePage(TcpConnection connection)
        {
            InitializeComponent();

            _connection = connection;

            SetContext();
        }

        private void SetContext()
        {
            _context = new AutoHomeContext
            {
            };
            DataContext = _context;
        }

        private void Configuration_Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                //_context.Configuration = new ControllerConfiguration();
                //_context.RaiseNotify("Configuration");

                var receive = _connection.SendAndReceive(new ConfigurationReadRequest());

                //using (var tcp = Program.AutoHome.Connect(IPAddress.Parse(_context.Selected.Ip)))
                //{
                //    var receive = tcp.SendAndReceive(new Message((byte)_context.Selected.UID, new ConfigurationReadRequest()));

                //    var content = receive.ReadContent<ConfigurationReadResponse>();

                //    _context.Configuration.WifiName = content.WifiName;
                //    _context.Configuration.Password = content.WifiPassword;
                //    _context.Configuration.Alias = content.Alias;
                //    _context.RaiseNotify("Configuration");
                //}
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private void Configuration_Save_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                //CheckSelected();

                //using (var tcp = Program.AutoHome.Connect(IPAddress.Parse(_context.Selected.Ip)))
                //{
                //    tcp.Send(new Message((byte)_context.Selected.UID, new ConfigurationSaveRequest
                //    {
                //        WifiName = _context.Configuration.WifiName,
                //        WifiPassword = _context.Configuration.Password,
                //        Alias = _context.Configuration.Alias
                //    }));
                //}
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private void UID_Save_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}
