using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Controller.Protocol
{
    public class AutoHome : IDisposable
    {
        private Task _udpReceive;
        private UdpClient _udpSend;

        public delegate void UdpReceived(ReceiveMessage message);
        public event UdpReceived OnUdpRecevied;

        public int SendPort { get; set; }
        public int ReceivePort { get; set; }

        public AutoHome(int sendPort, int receivePort)
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
                var receive = await udp.ReceiveAsync();

                var message = new ReceiveMessage(receive.Buffer);
                OnUdpRecevied?.Invoke(message);
            }
        }

        public void Dispose()
        {
            _udpSend.Close();
            _udpReceive.Dispose();
        }

        public void SendUdp(SendMessage message)
        {
            if (message.Type != MessageType.Ping)
            {
                throw new Exception("Only message of type Ping can be sent by udp packet!");
            }

            var ip = new IPEndPoint(IPAddress.Parse(message.Ip), SendPort);
            var buffer = message.GetBytes();
            _udpSend.Send(buffer, buffer.Length, ip);
        }
    }
}
