using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.CellingFan
{
    public enum CellingFanMessageType : byte
    {
        Unkown = 0,
        StateReadRequest = 1,
        StateReadResponse = 2,
        StateSaveRequest = 3
    }
}
