using AH.Protocol.Library.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor.BitMappers
{
    public class general_config_t
    {
        public byte Value;

        public int GeneralConfig_IntervalActive = 0;
        public int GeneralConfig_TemperatureSwitch = 1;
        public int GeneralConfig_HumiditySwitch = 2;

        public bool intervalActive
        {
            get { return BitFields.ReadBool(Value, GeneralConfig_IntervalActive); }
            set { BitFields.SetBool(ref Value, GeneralConfig_IntervalActive, value); }
        }

        public bool temperatureSwitch
        {
            get { return BitFields.ReadBool(Value, GeneralConfig_TemperatureSwitch); }
            set { BitFields.SetBool(ref Value, GeneralConfig_TemperatureSwitch, value); }
        }

        public bool humiditySwitch
        {
            get { return BitFields.ReadBool(Value, GeneralConfig_HumiditySwitch); }
            set { BitFields.SetBool(ref Value, GeneralConfig_HumiditySwitch, value); }
        }
    }
}