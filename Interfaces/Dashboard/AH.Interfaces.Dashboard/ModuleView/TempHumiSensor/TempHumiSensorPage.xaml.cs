using AH.Interfaces.Dashboard.Controls;
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
                Skip = 0,
                Take = 1
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
                    _context.RaiseNotify("ReadInterval");
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
                    _context.SaveData = content.GeneralConfig.saveData;
                    _context.RaiseNotify("SaveData");
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
                    generalConfig.saveData = _context.SaveData;

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

                    var index = 0;
                    var tempAnalaze = string.Concat(
                            content.Data
                                .Select(d => string.Format("{0} = {1}\n", index++.ToString(), d.ToString()))
                        );


                    var data = new byte[5];
                    for (int i = 0; i < 40; i++)
                    {
                        int lowCycles = content.Data[(i * 2) + 3];
                        int highCycles = content.Data[(i * 2) + 4];

                        data[i / 8] <<= 1;

                        if (highCycles > lowCycles)
                        {
                            data[i / 8] |= 1;
                        }
                    }

                    var success = (data[4] == ((data[0] + data[1] + data[2] + data[3]) & 0xFF)) ?
                     		1 : 0;

                    var temperature = dht_data_to_temperature(data);
                    var humidity = dht_data_to_humidity(data);

                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        public void HistoryRead_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = _connector.OpenTcpConnection())
                {
                    var receive = tcp.SendAndReceive(new HistoryReadRequest
                    {
                        Skip = (byte)_context.Skip,
                        Take = (byte)_context.Take
                    });

                    var content = receive.ReadContent<HistoryReadResponse>();

                    var data = new List<TempHumiSensorGraphModel>();

                    if (content.UnSavedData != null)
                    {
                        data.AddRange(ExtractData(content.UnSavedData));
                    }

                    data.AddRange(content.Data
                        .SelectMany(p => ExtractData(p)));

                    graph.AddData(data);
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private List<TempHumiSensorGraphModel> ExtractData(data_package_t package)
        {
            var result = new List<TempHumiSensorGraphModel>();

            var dateTime = DateTimeOffset.FromUnixTimeSeconds(package.started_timestamp).DateTime;
            var interval = package.readInterval;

            for (var i = 0; i < package.data.Length; i += 5)
            {
                var thisData = new byte[5];
                Array.Copy(package.data, i, thisData, 0, 5);

                var temperature = dht_data_to_temperature(thisData);
                var humidity = dht_data_to_humidity(thisData);

                if (temperature > 0 && humidity > 0)
                {
                    var switchs = new switchs_state_t { Value = thisData[4] };

                    result.Add(new TempHumiSensorGraphModel
                    {
                        DateTime = dateTime,
                        Temperature = temperature,
                        TemperatureSwitch = switchs.tempSwtichState,
                        Humidity = humidity,
                        HumiditySwitch = switchs.humiSwtichState
                    });
                }

                dateTime = dateTime.AddMilliseconds(interval);
            }

            return result;
        }

        public void HistoryClear_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                graph.ClearData();
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}