using AH.Protocol.Library.Connection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.ModuleView
{
    public class ModuleViewConnector
    {
        public int SendPort { get; set; }
        public int ReceivePort { get; set; }
        public int UID { get; set; }
        public string Ip { get; set; }

        public TcpConnection OpenTcpConnection()
        {
            var tcp = new TcpConnection(UID);
            tcp.StartSender(ReceivePort, System.Net.IPAddress.Parse(Ip));
            return tcp;
        }
    }
}