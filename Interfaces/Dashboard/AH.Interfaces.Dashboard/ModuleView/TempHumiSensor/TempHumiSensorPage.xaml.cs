using AH.Protocol.Library.Messages.TempHumiSensor;
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

namespace AH.Interfaces.Dashboard.ModuleView.TempHumiSensor
{
    public partial class TempHumiSensorPage : Page
    {
        private ModuleViewConnector _connector;
        private TempHumiSensorContext _context;

        public TempHumiSensorPage(ModuleViewConnector connector)
        {
            InitializeComponent();

            _connector = connector;

            SetContext();
        }

        private void SetContext()
        {
            _context = new TempHumiSensorContext
            {
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

                    _context.IntervalActive = content.IntervalActive;
                    _context.RaiseNotify("IntervalActive");
                    _context.ReadInverval = content.ReadInverval;
                    _context.RaiseNotify("ReadInverval");
                    _context.TemperatureSwitch = content.TemperatureSwitch;
                    _context.RaiseNotify("TemperatureSwitch");
                    _context.TempPointToOff = content.TempPointToOff;
                    _context.RaiseNotify("TempPointToOff");
                    _context.TempPointToOn = content.TempPointToOn;
                    _context.RaiseNotify("TempPointToOn");
                    _context.HumiditySwitch = content.HumiditySwitch;
                    _context.RaiseNotify("HumiditySwitch");
                    _context.HumiPointToOff = content.HumiPointToOff;
                    _context.RaiseNotify("HumiPointToOff");
                    _context.HumiPointToOn = content.HumiPointToOn;
                    _context.RaiseNotify("HumiPointToOn");
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
                        //PointToOff = (byte)_context.PointToOff,
                        //PointToOn = (byte)_context.PointToOn,
                        //ReadInverval = (ushort)_context.ReadInverval
                    });
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private void OneShotRead_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = _connector.OpenTcpConnection())
                {
                    var receive = tcp.SendAndReceive(new OneShotReadRequest());

                    var content = receive.ReadContent<OneShotReadResponse>();

                    _context.OneShotTemperature = (int)content.Temperature;
                    _context.RaiseNotify("OneShotTemperature");
                    _context.OneShotHumidity = (int)content.Humidity;
                    _context.RaiseNotify("OneShotHumidity");
                    _context.RelayState = content.RelayState == 1 ? "Open" : "Closed";
                    _context.RaiseNotify("RelayState");
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private void ToggleButton_ChangeText(object sender, RoutedEventArgs e)
        {
            var button = sender as System.Windows.Controls.Primitives.ToggleButton;
            if (button.IsChecked ?? false)
            {
                button.Content = "Deactive";
            }
            else
            {
                button.Content = "Active";
            }
        }
    }
}