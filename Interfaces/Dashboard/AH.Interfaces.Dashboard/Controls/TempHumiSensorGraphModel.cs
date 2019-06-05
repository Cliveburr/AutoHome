using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.Controls
{
    public class TempHumiSensorGraphModel
    {
        public DateTime DateTime { get; set; }
        public float Temperature { get; set; }
        public float Humidity { get; set; }
        public bool TemperatureSwitch { get; set; }
        public bool HumiditySwitch { get; set; }
    }
}