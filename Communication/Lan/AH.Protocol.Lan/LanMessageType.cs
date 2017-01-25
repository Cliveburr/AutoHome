using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Lan
{
    public enum LanMessageType : byte
    {
        Nop = 0,
        RequestInfo = 1,
        InfoResponse = 2,
        ModuleMessage = 50
    }
}