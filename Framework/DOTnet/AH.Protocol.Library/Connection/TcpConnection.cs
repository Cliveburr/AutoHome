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
        public int MaximumTcpPackageSize { get; } = 1460;
        public int My_UID { get; set; }
        public int To_UID { get; set; }

        private TcpClient _send;

        public TcpConnection(int myuid, int touid, IPAddress address, int port)
        {
            My_UID = myuid;
            To_UID = touid;

            _send = new TcpClient();
            _send.SendTimeout = 3000;
            _send.Connect(new IPEndPoint(address, port));
        }

        public void Dispose()
        {
            try
            {
                _send?.Close();
            }
            catch { }
        }

        public Task Send(IContentMessage content)
        {
            return Send(new Message((byte)My_UID, (byte)To_UID, content));
        }

        private async Task Send(Message message)
        {
            var buffer = message.GetBytes();

            await _send.Client.SendAsync(new ArraySegment<byte>(buffer, 0, buffer.Length), SocketFlags.None);
        }

        public async Task<T> SendAndReceive<T>(IContentMessage content) where T : IContentMessage
        {
            var message = await SendAndReceive(new Message((byte)My_UID, (byte)To_UID, content));
            return message.ReadContent<T>();
        }

        public Task<Message> SendAndReceive(IContentMessage content)
        {
            return SendAndReceive(new Message((byte)My_UID, (byte)To_UID, content));
        }

        private async Task<Message> SendAndReceive(Message message)
        {
            var buffer = message.GetBytes();

            await _send.Client.SendAsync(new ArraySegment<byte>(buffer, 0, buffer.Length), SocketFlags.None);

            var timeOutDateTime = DateTime.Now.AddMilliseconds(_send.ReceiveTimeout);
            while (_send.Available == 0 && DateTime.Now < timeOutDateTime) ;

            using (var mem = new MemoryStream())
            using (var writer = new BinaryWriter(mem))
            {
                do
                {
                    var receiveBuffer = new byte[MaximumTcpPackageSize];
                    var received = await _send.Client.ReceiveAsync(new ArraySegment<byte>(receiveBuffer, 0, MaximumTcpPackageSize), SocketFlags.None);
                    writer.Write(receiveBuffer, 0, received);
                } while (_send.Available > 0);
                return new Message(mem.ToArray());
            }
        }
    }
}