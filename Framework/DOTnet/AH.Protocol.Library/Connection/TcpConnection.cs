using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Connection
{
    public class TcpConnection : IDisposable
    {
        private TcpClient _tcp;

        public TcpConnection(int tcpPort, IPAddress address)
        {
            _tcp = new TcpClient();
            _tcp.SendTimeout = 1000;
            var ip = new IPEndPoint(address, tcpPort);

            _tcp.Connect(ip);
        }

        public void Dispose()
        {
            try
            {
                _tcp?.Close();
            }
            catch { }
        }

        public void Send(Message message)
        {
            var buffer = message.GetBytes();

            _tcp.Client.Send(buffer, buffer.Length, SocketFlags.None);
        }

        public Message SendAndReceive(Message message)
        {
            var buffer = message.GetBytes();

            _tcp.Client.Send(buffer, buffer.Length, SocketFlags.None);

            var timeOutDateTime = DateTime.Now.AddMilliseconds(_tcp.ReceiveTimeout);
            while (_tcp.Available == 0 && DateTime.Now < timeOutDateTime) ;

            using (var mem = new MemoryStream())
            using (var writer = new BinaryWriter(mem))
            {
                do
                {
                    var receiveBuffer = new byte[1024];
                    var received = _tcp.Client.Receive(receiveBuffer, SocketFlags.None);
                    writer.Write(receiveBuffer, 0, received);
                } while (_tcp.Available > 0);
                return new Message(mem.ToArray());
            }
        }
    }
}