using System;
using System.Collections.Generic;
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

        private UdpClient _send;
        private UdpClient _receive;

        public void StartSender(int port)
        {
            SendPort = port;

            _send = new UdpClient();
        }

        public void StartReceiver(int port)
        {
            ReceivePort = port;

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
                OnUdpReceived?.Invoke(source.Address, message);
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

        public void SendUdp(IPAddress address, Message message)
        {
            var buffer = message.GetBytes();

            if (address == IPAddress.Broadcast)
            {
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
            else
            {
                _send.EnableBroadcast = false;

                var ip = new IPEndPoint(address, SendPort);
                _send.Send(buffer, buffer.Length, ip);
            }
        }
    }
}