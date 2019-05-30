using AH.Protocol.Library;
using AH.Protocol.Library.Helpers;
using AH.Protocol.Library.Messages.TempHumiSensor;
using AH.Protocol.Library.Messages.TempHumiSensor.BitMappers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;

namespace AH.Module.Simulation
{
    public partial class TempHumiSensorPort : PortBase
    {
        private static TempHumiSensorPort _instance;
        public static TempHumiSensorPort Instance { get; } = _instance ?? new TempHumiSensorPort();

        private class temphumisensor_config_t
        {
            public general_config_t generalConfig = new general_config_t();
            public short tempPointToOff;
            public short tempPointToOn;
            public ushort humiPointToOff;
            public ushort humiPointToOn;
            public ushort readInterval;
        }

        private temphumisensor_config_t temphumisensor_config = new temphumisensor_config_t();

        private TempHumiSensorPort()
        {
            temphumisensor_datainfo_load();

            readInterval_timer = new Timer();
            readInterval_timer.Elapsed += temphumisensor_timer_cb;
        }

        public IContentMessage OnTcpReceived(Message message)
        {
            switch (message.Msg)
            {
                case (byte)TempHumiSensorMessageType.ConfigurationReadRequest: return HandleConfigurationRead(message);
                case (byte)TempHumiSensorMessageType.ConfigurationSaveRequest: return HandleConfigurationSave(message);
                case (byte)TempHumiSensorMessageType.OneShotReadRequest: return HandleOneShotRead(message);
                default: return null;
            }
        }

        private IContentMessage HandleConfigurationRead(Message message)
        {
            Program.Log("HandleConfigurationRead");

            return new ConfigurationReadResponse
            {
                GeneralConfig = temphumisensor_config.generalConfig,
                TempPointToOff = temphumisensor_config.tempPointToOff,
                TempPointToOn = temphumisensor_config.tempPointToOn,
                HumiPointToOff = temphumisensor_config.humiPointToOff,
                HumiPointToOn = temphumisensor_config.humiPointToOn,
                ReadInverval = temphumisensor_config.readInterval
            };
        }

        private IContentMessage HandleConfigurationSave(Message message)
        {
            Program.Log("HandleConfigurationSave");

            var content = message.ReadContent<ConfigurationSaveRequest>();

            temphumisensor_config.generalConfig.Value = content.GeneralConfig.Value;
            temphumisensor_config.tempPointToOff = content.TempPointToOff;
            temphumisensor_config.tempPointToOn = content.TempPointToOn;
            temphumisensor_config.humiPointToOff = content.HumiPointToOff;
            temphumisensor_config.humiPointToOn = content.HumiPointToOn;
            temphumisensor_config.readInterval = content.ReadInverval;

            temphumisensor_set_timers();

            return null;
        }

        private IContentMessage HandleOneShotRead(Message message)
        {
            Program.Log("HandleConfigurationRead");

            dht_read();

            return new OneShotReadResponse
            {
                RelayStates = swtichStates,
                Data = moduleOne.data
            };
        }


        // working simulation

        public class dht_module_t
        {
            public bool success;
            public byte[] data;

            public dht_module_t()
            {
                data = new byte[5];
            }
        };

        private switchs_state_t swtichStates { get; set; } = new switchs_state_t();
        private bool isActive;
        private Timer readInterval_timer;
        private dht_module_t moduleOne = new dht_module_t();

        private void os_timer_disarm()
        {
            readInterval_timer.Stop();
        }

        private void os_timer_arm(ushort value)
        {
            readInterval_timer.Interval = value;
            readInterval_timer.Start();
        }

        private void temphumisensor_set_tempswitch(byte state)
        {
            swtichStates.tempSwtichState = state == 1;    // dont need state == 1
        }

        private void temphumisensor_set_humiswitch(byte state)
        {
            swtichStates.humiSwtichState = state == 1;    // dont need state == 1
        }

        private void temphumisensor_resetall()
        {
            isActive = false;
            temphumisensor_set_tempswitch(0);
            temphumisensor_set_humiswitch(0);
        }

        private void temphumisensor_set_timers()
        {
            if (isActive)
            {
                os_timer_disarm(); // os_timer_disarm(&readInterval_timer);
            }

            if (temphumisensor_config.generalConfig.intervalActive)
            {
                os_timer_arm(temphumisensor_config.readInterval); // os_timer_arm(&readInterval_timer, temphumisensor_config.readInterval, 1);
                isActive = true;
            }
            else
            {
                temphumisensor_resetall();
            }
        }

        private short dht_data_to_temperature(byte[] data)
        {
            var temp = data[2] & 0x7F;
            temp = (temp << 8) + data[3];
            if ((data[2] & 0x80) != 0)
            {
                temp *= -1;
            }
            return (short)temp;
        }

        private ushort dht_data_to_humidity(byte[] data)
        {
            return (ushort)((data[0] << 8) + data[1]);
        }

        private void temphumisensor_timer_cb(object sender, ElapsedEventArgs e)
        {
            readInterval_timer.Stop();  // just in simulation

            dht_read();   // dht_read(&moduleOne);

            if (!moduleOne.success)
            {
                return;
            }

            if (temphumisensor_config.generalConfig.temperatureSwitch)
            {
                var temp = dht_data_to_temperature(moduleOne.data);  // int16_t temp = dht_data_to_temperature(&moduleOne.data);

                if (swtichStates.tempSwtichState)
                {
                    if (temp < temphumisensor_config.tempPointToOff)
                    {
                        temphumisensor_set_tempswitch(0);
                    }
                }
                else
                {
                    if (temp > temphumisensor_config.tempPointToOn)
                    {
                        temphumisensor_set_tempswitch(1);
                    }
                }
            }

            if (temphumisensor_config.generalConfig.humiditySwitch)
            {
                var humi = dht_data_to_humidity(moduleOne.data);   // uint16_t humi = dht_data_to_humidity(&moduleOne.data);

                if (swtichStates.humiSwtichState)
                {
                    if (humi > temphumisensor_config.humiPointToOff)
                    {
                        temphumisensor_set_humiswitch(0);
                    }
                }
                else
                {
                    if (humi < temphumisensor_config.humiPointToOn)
                    {
                        temphumisensor_set_humiswitch(1);
                    }
                }
            }

            if (temphumisensor_config.generalConfig.saveData)
            {
                temphumisensor_data_save();
            }
            
            readInterval_timer.Start();  // just in simulation
        }

        private bool _isFirstRead = true;
        private short _temp;
        private ushort _humi;
        private Random _rnd = new Random((int)DateTime.Now.Ticks);

        public void dht_read()
        {
            moduleOne.success = true;

            if (_isFirstRead)
            {
                moduleOne.data[0] = Convert.ToByte("00000010", 2);
                moduleOne.data[1] = Convert.ToByte("10001100", 2);
                moduleOne.data[2] = Convert.ToByte("00000001", 2);
                moduleOne.data[3] = Convert.ToByte("01011111", 2);
                moduleOne.data[4] = Convert.ToByte("11101110", 2);

                var checksum = (byte)(moduleOne.data[0] + moduleOne.data[1] + moduleOne.data[2] + moduleOne.data[3]);
                if (checksum != moduleOne.data[4])
                {
                    throw new Exception();
                }

                _isFirstRead = false;

                _temp = dht_data_to_temperature(moduleOne.data);
                _humi = dht_data_to_humidity(moduleOne.data);
            }
            else
            {
                var newTemp = (short)(_temp + (_rnd.Next(0, 10) * (swtichStates.tempSwtichState ? -1 : 1)));
                var newHumi = (ushort)(_humi + (_rnd.Next(0, 10) * (swtichStates.humiSwtichState ? 1 : -1)));

                if (newTemp > 40 && newTemp < 400)
                {
                    _temp = newTemp;
                }

                if (newHumi > 600 && newHumi < 1000)
                {
                    _humi = newHumi;
                }

                using (var mem = new MemoryStream())
                using (var writer = new BinaryWriter(mem))
                {
                    writer.Write(_temp);
                    writer.Write(_humi);

                    moduleOne.data = mem.ToArray().Reverse().ToArray();
                }
            }
        }
    }
}