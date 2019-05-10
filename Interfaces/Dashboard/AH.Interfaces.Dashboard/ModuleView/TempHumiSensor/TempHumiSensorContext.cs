using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.ModuleView.TempHumiSensor
{
    public class TempHumiSensorContext : BaseContext
    {
        public int PointToOff { get; set; }
        public int PointToOn { get; set; }
        public int ReadInverval { get; set; }
        public int OneShotTemperature { get; set; }
        public int OneShotHumidity { get; set; }
        public string RelayState { get; set; }
    }
}