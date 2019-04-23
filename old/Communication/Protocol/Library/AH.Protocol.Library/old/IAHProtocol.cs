using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public interface IAHProtocol_old
    {
        int TimeOut { get; set; }
        ushort UID { get; }
        MessageArriveDelegate MessageArrive { get; set; }
        void Send(ushort receiverUID, byte[] messageBody, MessageArriveDelegate callBack = null);
    }
}