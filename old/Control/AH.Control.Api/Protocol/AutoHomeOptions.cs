using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Protocol
{
    public class AutoHomeOptions
    {
        public ushort UID { get; set; }
        public int TcpSendPort { get; set; }
        public int TcpReceivePort { get; set; }
        public int UdpSendPort { get; set; }
        public int UdpReceivePort { get; set; }
        public int ApiPort { get; set; }
    }
}