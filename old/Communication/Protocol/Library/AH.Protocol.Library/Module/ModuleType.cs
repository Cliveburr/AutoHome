using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Module
{
    public enum ModuleType : byte
    {
        Invalid = 0,
        LedRibbonRgb = 1,
        IncandescentLamp = 2
    }
}