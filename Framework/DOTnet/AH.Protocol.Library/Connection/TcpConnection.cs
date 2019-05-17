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
        public delegate void TcpReceived(TcpClient client, Message message);
        public event TcpReceived OnTcpReceived;

        public int SendPort { get; private set; }
        public int ReceivePort { get; private set; }
        public int UID { get; set; }

        private TcpClient _send;
        private TcpListener _receive;

        public int MaxMessageSize { get; set; }

        private struct ReceiveClientData
        {
            public TcpClient TcpClient;
            public byte[] Buffer;
        }

        public TcpConnection(int uid)
        {
            UID = uid;
            MaxMessageSize = 2048;
        }

        public void StartSender(int port, IPAddress address)
        {
            SendPort = port;

            _send = new TcpClient();
            _send.SendTimeout = 1000;
            _send.Connect(new IPEndPoint(address, port));
        }

        public void StartReceiver(int port)
        {
            ReceivePort = port;

            _receive = new TcpListener(IPAddress.Any, port);
            _receive.Start();
            _receive.BeginAcceptTcpClient(AcceptTcpClient, null);
        }

        private void AcceptTcpClient(IAsyncResult result)
        {
            try
            {
                var data = new ReceiveClientData
                {
                    TcpClient = _receive.EndAcceptTcpClient(result),
                    Buffer = new byte[MaxMessageSize]
                };

                if (data.TcpClient.Client.Connected)
                {
                    data.TcpClient.Client.BeginReceive(data.Buffer, 0, data.Buffer.Length, SocketFlags.None, Receive, data);
                }
            }
            catch (Exception err)
            {
            }
            finally
            {
                _receive.BeginAcceptTcpClient(AcceptTcpClient, null);
            }
        }

        private void Receive(IAsyncResult result)
        {
            var data = (ReceiveClientData)result.AsyncState;
            try
            {
                var bytes = data.TcpClient.Client.EndReceive(result);
                if (bytes > 0)
                {
                    OnTcpReceived?.Invoke(data.TcpClient, new Message(data.Buffer));
                }
            }
            catch (Exception err)
            {
            }
            finally
            {
                try
                {
                    data.TcpClient.Client.BeginReceive(data.Buffer, 0, data.Buffer.Length, SocketFlags.None, Receive, data);
                }
                catch { }
            }
        }

        public void Dispose()
        {
            try
            {
                _send?.Close();
                _receive?.Stop();
            }
            catch { }
        }

        public void Send(IContentMessage content)
        {
            Send(new Message((byte)UID, content));
        }

        private void Send(Message message)
        {
            var buffer = message.GetBytes();

            _send.Client.Send(buffer, buffer.Length, SocketFlags.None);
        }

        public Message SendAndReceive(IContentMessage content)
        {
            return SendAndReceive(new Message((byte)UID, content));
        }

        private Message SendAndReceive(Message message)
        {
            var buffer = message.GetBytes();

            _send.Client.Send(buffer, buffer.Length, SocketFlags.None);

            var timeOutDateTime = DateTime.Now.AddMilliseconds(_send.ReceiveTimeout);
            while (_send.Available == 0 && DateTime.Now < timeOutDateTime) ;

            using (var mem = new MemoryStream())
            using (var writer = new BinaryWriter(mem))
            {
                do
                {
                    var receiveBuffer = new byte[MaxMessageSize];
                    var received = _send.Client.Receive(receiveBuffer, SocketFlags.None);
                    writer.Write(receiveBuffer, 0, received);
                } while (_send.Available > 0);
                return new Message(mem.ToArray());
            }
        }
    }
}