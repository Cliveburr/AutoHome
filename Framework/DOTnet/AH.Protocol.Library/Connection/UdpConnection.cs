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
        private Task _udpReceive;
        private UdpClient _udpSend;

        public delegate void UdpReceived(IPAddress address, Message message);
        public event UdpReceived OnUdpReceived;

        public int SendPort { get; set; }
        public int ReceivePort { get; set; }

        public UdpConnection(int sendPort, int receivePort)
        {
            SendPort = sendPort;
            ReceivePort = receivePort;

            _udpSend = new UdpClient();
            _udpReceive = Task.Run((Action)ReceiveUdp);
        }

        private async void ReceiveUdp()
        {
            var udp = new UdpClient(ReceivePort);

            while (true)
            {
                try
                {
                    var receive = await udp.ReceiveAsync();

                    var message = new Message(receive.Buffer);
                    OnUdpReceived?.Invoke(receive.RemoteEndPoint.Address, message);
                }
                catch (ObjectDisposedException err)
                {
                    break;
                }
                catch (Exception err)
                {
                    //OnUdpReceived?.Invoke(null, err.Message);
                    break;
                }
            }
        }

        public virtual void Dispose()
        {
            try
            {
                _udpSend.Close();
                _udpReceive.Dispose();
            }
            catch { }
        }

        public void SendUdp(IPAddress address, Message message)
        {
            if (!(message.Type == MessageType.Ping || message.Type == MessageType.Pong))
            {
                throw new Exception("Only message of type Ping or Pong can be sent by udp packet!");
            }

            var buffer = message.GetBytes();

            if (address == IPAddress.Broadcast)
            {
                _udpSend.EnableBroadcast = true;
                var host = Dns.GetHostEntryAsync(Dns.GetHostName()).GetAwaiter().GetResult();

                foreach (var adds in host.AddressList.Where(a => a.AddressFamily == AddressFamily.InterNetwork))
                {
                    var ip = adds.GetAddressBytes();
                    ip[3] = 255;
                    var endPoint = new IPEndPoint(new IPAddress(ip), SendPort);

                    _udpSend.Send(buffer, buffer.Length, endPoint);
                }
            }
            else
            {
                var ip = new IPEndPoint(address, SendPort);
                _udpSend.Send(buffer, buffer.Length, ip);
            }
        }
    }
}