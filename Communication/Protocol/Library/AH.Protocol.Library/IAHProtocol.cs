using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public class IAHProtocol
    {
        int TimeOut { get; set; }
        ushort UID { get; }
        MessageArriveDelegate MessageArrive { get; }
    }
}