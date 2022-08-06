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
    public class UdpConnection : IDisposable
    {
        public delegate void UdpReceived(IPAddress address, Message message);
        public event UdpReceived OnUdpReceived;

        public int SendPort { get; private set; }
        public int ReceivePort { get; private set; }
        public byte My_UID { get; set; }
        public int ReceiveTimeout { get; set; } = 3000;

        private UdpClient _send;
        private UdpClient _receive;
        private TaskCompletionSource<Message> _waitingReturn;

        public UdpConnection(byte myUid, int sendPort, int receiverPort)
        {
            My_UID = myUid;

            SendPort = sendPort;
            _send = new UdpClient();

            ReceivePort = receiverPort;
            _receive = new UdpClient(ReceivePort);
            _receive.BeginReceive(OnUdpData, null);
        }

        private void OnUdpData(IAsyncResult result)
        {
            try
            {
                var source = new IPEndPoint(0, 0);
                var bytes = _receive.EndReceive(result, ref source);

                var message = new Message(bytes);

                if (message.To_UID == My_UID || message.To_UID == 0)
                {
                    if (_waitingReturn != null)
                    {
                        _waitingReturn.SetResult(message);
                    }
                    else
                    {
                        OnUdpReceived?.Invoke(source.Address, message);
                    }
                }
            }
            catch (ObjectDisposedException err)
            {
            }
            catch (Exception err)
            {
                //OnUdpReceived?.Invoke(null, err.Message);
            }
            finally
            {
                _receive.BeginReceive(OnUdpData, null);
            }
        }

        public virtual void Dispose()
        {
            try
            {
                _receive?.Close();
                _receive?.Dispose();

                _send?.Dispose();
            }
            catch { }
        }

        public void SendBroadcast(IContentMessage content)
        {
            SendBroadcast(new Message(My_UID, 0, content));
        }

        private void SendBroadcast(Message message)
        {
            var buffer = message.GetBytes();

            _send.EnableBroadcast = true;
            var host = Dns.GetHostEntryAsync(Dns.GetHostName()).GetAwaiter().GetResult();

            foreach (var adds in host.AddressList.Where(a => a.AddressFamily == AddressFamily.InterNetwork))
            {
                var ip = adds.GetAddressBytes();
                ip[3] = 255;
                var endPoint = new IPEndPoint(new IPAddress(ip), SendPort);

                _send.Send(buffer, buffer.Length, endPoint);
            }
        }

        public void Send(IPAddress address, byte toUID, IContentMessage content)
        {
            Send(address, new Message(My_UID, toUID, content));
        }

        private void Send(IPAddress address, Message message)
        {
            var buffer = message.GetBytes();

            var ip = new IPEndPoint(address, SendPort);
            _send.EnableBroadcast = false;
            _send.Send(buffer, buffer.Length, ip);
        }

        public async Task<T> SendAndReceive<T>(IPAddress address, byte toUID, IContentMessage content) where T : IContentMessage
        {
            var message = await SendAndReceive(address, new Message(My_UID, toUID, content));
            return message.ReadContent<T>();
        }

        public Task<Message> SendAndReceive(IPAddress address, byte toUID, IContentMessage content)
        {
            return SendAndReceive(address, new Message(My_UID, toUID, content));
        }

        private async Task<Message> SendAndReceive(IPAddress address, Message message)
        {
            var buffer = message.GetBytes();

            var ip = new IPEndPoint(address, SendPort);
            _send.EnableBroadcast = false;
            _send.Send(buffer, buffer.Length, ip);

            _waitingReturn = new TaskCompletionSource<Message>();

            var completed = await Task.WhenAny(_waitingReturn.Task, Task.Delay(ReceiveTimeout));
            if (completed == _waitingReturn.Task)
            {
                var result = _waitingReturn.Task.Result;
                _waitingReturn = null;
                return result;
            }
            else
            {
                _waitingReturn = null;
                throw new TimeoutException();
            }
        }
    }
}