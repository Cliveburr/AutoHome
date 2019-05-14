using AH.Protocol.Library.Messages.AutoHome;
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
        private ModuleViewConnector _connector;
        private AutoHomeContext _context;

        public AutoHomePage(ModuleViewConnector connector)
        {
            InitializeComponent();

            _connector = connector;

            SetContext();
        }

        private void SetContext()
        {
            _context = new AutoHomeContext
            {
                UID = _connector.UID
            };
            DataContext = _context;
        }

        private void Configuration_Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = _connector.OpenTcpConnection())
                {
                    var receive = tcp.SendAndReceive(new ConfigurationReadRequest());

                    var content = receive.ReadContent<ConfigurationReadResponse>();

                    _context.WifiName = content.WifiName;
                    _context.RaiseNotify("WifiName");
                    _context.WifiPassword = content.WifiPassword;
                    _context.RaiseNotify("WifiPassword");
                    _context.Alias = content.Alias;
                    _context.RaiseNotify("Alias");
                    _context.Category = content.Category;
                    _context.RaiseNotify("Category");
                }
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
                using (var tcp = _connector.OpenTcpConnection())
                {
                    tcp.Send(new ConfigurationSaveRequest
                    {
                        WifiName = _context.WifiName,
                        WifiPassword = _context.WifiPassword,
                        Alias = _context.Alias,
                        Category = _context.Category
                    });
                }
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
                using (var tcp = _connector.OpenTcpConnection())
                {
                    tcp.Send(new UIDSaveRequest
                    {
                        UID = (byte)_context.UID
                    });
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}
