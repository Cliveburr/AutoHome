using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public delegate void ReceiverDelegate_old(MessagePackage package);

    public interface IPhysicalProtocolCouple
    {
        void Send(MessagePackage package);
        event ReceiverDelegate_old Receiver;
    }
}