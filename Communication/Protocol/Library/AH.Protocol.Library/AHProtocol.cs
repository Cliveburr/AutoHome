using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public class AHProtocol : IAHProtocol
    {
        public int TimeOut { get; set; }

        private ushort _UID;
        private MessageArriveDelegate _messageArrive;

        public AHProtocol(ushort UID, int timeOut, MessageArriveDelegate messageArrive)
        {
            _UID = UID;
            _messageArrive = messageArrive;
        }

        public ushort UID
        {
            get
            {
                return _UID;
            }
        }

        public MessageArriveDelegate MessageArrive
        {
            get
            {
                return _messageArrive;
            }
        }

        public void Send(ushort receiverUID, string messageBody, MessageArriveDelegate callBack = null)
        {

        }
    }
}