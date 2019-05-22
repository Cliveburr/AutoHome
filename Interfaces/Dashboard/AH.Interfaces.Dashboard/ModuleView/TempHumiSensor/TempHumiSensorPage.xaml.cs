using AH.Protocol.Library.Messages.TempHumiSensor;
using AH.Protocol.Library.Messages.TempHumiSensor.BitMappers;
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

                    _context.IntervalActive = content.GeneralConfig.intervalActive;
                    _context.RaiseNotify("IntervalActive");
                    _context.ReadInterval = content.ReadInverval;
                    _context.RaiseNotify("ReadInverval");
                    _context.TemperatureSwitch = content.GeneralConfig.temperatureSwitch;
                    _context.RaiseNotify("TemperatureSwitch");
                    _context.TempPointToOff = content.TempPointToOff / 10;
                    _context.RaiseNotify("TempPointToOff");
                    _context.TempPointToOn = content.TempPointToOn / 10;
                    _context.RaiseNotify("TempPointToOn");
                    _context.HumiditySwitch = content.GeneralConfig.humiditySwitch;
                    _context.RaiseNotify("HumiditySwitch");
                    _context.HumiPointToOff = content.HumiPointToOff / 10;
                    _context.RaiseNotify("HumiPointToOff");
                    _context.HumiPointToOn = content.HumiPointToOn / 10;
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
                    var generalConfig = new general_config_t();
                    generalConfig.intervalActive = _context.IntervalActive;
                    generalConfig.temperatureSwitch = _context.TemperatureSwitch;
                    generalConfig.humiditySwitch = _context.HumiditySwitch;

                    tcp.Send(new ConfigurationSaveRequest
                    {
                        GeneralConfig = generalConfig,
                        TempPointToOff = (short)(_context.TempPointToOff * 10),
                        TempPointToOn = (short)(_context.TempPointToOn * 10),
                        HumiPointToOff = (ushort)(_context.HumiPointToOff * 10),
                        HumiPointToOn = (ushort)(_context.HumiPointToOn * 10),
                        ReadInverval = (ushort)_context.ReadInterval
                    });
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private float dht_data_to_temperature(byte[] data)
        {
            var temp = data[2] & 0x7F;
            temp = (temp << 8) + data[3];
            if ((data[2] & 0x80) != 0)
            {
                temp *= -1;
            }
            return temp / (float)10;
        }

        private float dht_data_to_humidity(byte[] data)
        {
            return ((data[0] << 8) + data[1]) / (float)10;
        }

        private void OneShotRead_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = _connector.OpenTcpConnection())
                {
                    var receive = tcp.SendAndReceive(new OneShotReadRequest());

                    var content = receive.ReadContent<OneShotReadResponse>();

                    var temperature = dht_data_to_temperature(content.Data);
                    var humidity = dht_data_to_humidity(content.Data);

                    _context.OneShotTemperature = temperature.ToString("F");
                    _context.RaiseNotify("OneShotTemperature");
                    _context.OneShotHumidity = humidity.ToString("F");
                    _context.RaiseNotify("OneShotHumidity");
                    _context.TemperatureRelayState = content.RelayStates.tempSwtichState ? "Open" : "Closed";
                    _context.RaiseNotify("TemperatureRelayState");
                    _context.HumidityRelayState = content.RelayStates.humiSwtichState ? "Open" : "Closed";
                    _context.RaiseNotify("HumidityRelayState");
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

        public void DataRead_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = _connector.OpenTcpConnection())
                {
                    var receive = tcp.SendAndReceive(new DataReadRequest());

                    var content = receive.ReadContent<DataReadResponse>();


                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}