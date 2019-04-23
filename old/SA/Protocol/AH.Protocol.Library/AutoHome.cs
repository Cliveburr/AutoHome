using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public class AutoHome : IDisposable
    {
        private Task _udpReceive;
        private UdpClient _udpSend;

        public delegate void UdpReceived(IPAddress address, Message message);
        public event UdpReceived OnUdpReceived;

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
                    //ReceivePong?.Invoke(null, err);
                    break;
                }
            }
        }

        public virtual void Dispose()
        {
            _udpSend.Close();
            _udpReceive.Dispose();
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
