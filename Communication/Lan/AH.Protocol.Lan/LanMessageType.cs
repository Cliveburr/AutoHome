using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Lan
{
    public enum LanMessageType : byte
    {
        Nop = 0,
        InfoRequest = 1,
        InfoResponse = 2,
        ApiPing = 3,
        ApiPong = 4,
        ModuleMessage = 50
    }
}