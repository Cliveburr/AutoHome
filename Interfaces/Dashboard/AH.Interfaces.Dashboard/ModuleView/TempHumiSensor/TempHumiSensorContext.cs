using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.ModuleView.TempHumiSensor
{
    public class TempHumiSensorContext : BaseContext
    {
        public bool IntervalActive { get; set; }
        public bool TemperatureSwitch { get; set; }
        public int TempPointToOff { get; set; }
        public int TempPointToOn { get; set; }
        public bool HumiditySwitch { get; set; }
        public int HumiPointToOff { get; set; }
        public int HumiPointToOn { get; set; }
        public int ReadInterval { get; set; }
        public string OneShotTemperature { get; set; }
        public string OneShotHumidity { get; set; }
        public string TemperatureRelayState { get; set; }
        public string HumidityRelayState { get; set; }
        public bool SaveData { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
    }
}