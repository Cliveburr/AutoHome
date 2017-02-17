using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Protocol
{
    public class AutoHomeOptions
    {
        public ushort UID { get; set; }
        public int SendPort { get; set; }
        public int ReceivePort { get; set; }
        public int ApiPort { get; set; }
    }
}