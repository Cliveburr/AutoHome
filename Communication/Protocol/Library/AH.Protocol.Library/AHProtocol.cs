using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public class AhProtocol
    {
        public event ReceiverDelegate Receiver;
        public ushort UID { get; private set; }
        private IPhysicalProtocol _physicalCouple;

        public AhProtocol(ushort UID, IPhysicalProtocol physical)
        {
            this.UID = UID;
            _physicalCouple = physical;
            _physicalCouple.Receiver += _physicalCouple_Receiver;
        }

        public void Send(MessageBase message)
        {
            message.SenderUID = UID;

            _physicalCouple.Send(message);
        }

        private void _physicalCouple_Receiver(MessageBase message)
        {
            if (!(message.ReceiverUID == 0 || message.ReceiverUID == UID))
                return;

            Receiver?.Invoke(message);
        }
    }
}