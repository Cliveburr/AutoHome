using System;
using System.Collections.Generic;
using System.IO;
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

        public delegate void UdpReceived(IPAddress address, ReceiveMessage message);
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
                OnUdpRecevied?.Invoke(receive.RemoteEndPoint.Address, message);
            }
        }

        public void Dispose()
        {
            _udpSend.Close();
            _udpReceive.Dispose();
        }

        public void SendUdp(IPAddress address, SendMessage message)
        {
            if (message.Type != MessageType.Ping)
            {
                throw new Exception("Only message of type Ping can be sent by udp packet!");
            }

            var ip = new IPEndPoint(address, SendPort);
            var buffer = message.GetBytes();
            _udpSend.Send(buffer, buffer.Length, ip);
        }

        public AutoHomeConnection Connect(IPAddress address)
        {
            return new AutoHomeConnection(this, address);
        }
    }

    public class AutoHomeConnection : IDisposable
    {
        private AutoHome _autohome;
        private TcpClient _tcp;

        public AutoHomeConnection(AutoHome autohome, IPAddress address)
        {
            _autohome = autohome;
            _tcp = new TcpClient();
            _tcp.SendTimeout = 1000;
            var ip = new IPEndPoint(address, autohome.SendPort);

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

        public void Send(SendMessage message)
        {
            var buffer = message.GetBytes();

            _tcp.Client.Send(buffer, buffer.Length, SocketFlags.None);
        }

        public ReceiveMessage SendAndReceive(SendMessage message)
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
                return new ReceiveMessage(mem.ToArray());
            }
        }
    }
}
