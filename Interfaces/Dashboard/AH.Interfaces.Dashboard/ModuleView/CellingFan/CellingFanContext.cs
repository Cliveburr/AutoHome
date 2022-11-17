using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.ModuleView.CellingFan
{
    public class CellingFanContext : BaseContext
    {
        public bool LightOn { get; set; }
        public bool LightOff { get; set; }
        public bool FanOn { get; set; }
        public bool FanOff { get; set; }
        public bool OrientationUp { get; set; }
        public bool OrientationDown { get; set; }
        public bool SpeedMin { get; set; }
        public bool SpeedMedium { get; set; }
        public bool SpeedMax { get; set; }

        public bool ConfigInterruptionsOnOff { get; set; }
        public bool ConfigFW1FW2Inversion { get; set; }
        public bool ConfigFI1FI2Inversion { get; set; }
    }
}
