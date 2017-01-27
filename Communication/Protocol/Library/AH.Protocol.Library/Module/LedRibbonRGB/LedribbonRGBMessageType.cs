using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Module.LedRibbonRGB
{
    public enum LedribbonRGBMessageType : byte
    {
        Nop = 0,
        StateRequest = 1,
        StateResponse = 2,
        StateChange = 3
    }
}