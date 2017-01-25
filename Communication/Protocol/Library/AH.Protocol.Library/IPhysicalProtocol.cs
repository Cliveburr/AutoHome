using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public delegate void ReceiverDelegate(MessageBase message);

    public interface IPhysicalProtocol
    {
        void Send(MessageBase message);
        event ReceiverDelegate Receiver;
    }
}