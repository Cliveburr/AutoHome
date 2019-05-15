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
        public int ReadInverval { get; set; }
        public int OneShotTemperature { get; set; }
        public int OneShotHumidity { get; set; }
        public string RelayState { get; set; }
    }
}