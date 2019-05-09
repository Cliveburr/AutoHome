using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages
{
    public enum PortType : byte
    {
        Unkown = 0,
        AutoHome = 1,
        Fota = 2,
        RGBLedRibbon = 3,
        TempHumiSensor = 4
    }
}