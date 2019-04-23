using AH.Protocol.Lan.Message;
using AH.Protocol.Library;
using AH.Protocol.Library.Message;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Lan
{
    public class LanProtocol : IPhysicalProtocol
    {
        public event ReceiverDelegate Receiver;
        public int TcpReceivePort { get; private set; }
        public int TcpSendPort { get; private set; }
        public int UdpReceivePort { get; private set; }
        public int UdpSendPort { get; private set; }

        private TcpListener _tcpReceiver;
        private UdpClient _udpReceiver;
        private UdpClient _udpSender;

        public LanProtocol(int tcpReceivePort, int tcpSendPort, int udpReceivePort, int udpSendPort)
        {
            TcpReceivePort = tcpReceivePort;
            TcpSendPort = tcpSendPort;
            UdpReceivePort = udpReceivePort;
            UdpSendPort = udpSendPort;

            _tcpReceiver = new TcpListener(IPAddress.Any, tcpReceivePort);

            Task.Run(new Action(TcpReceiver));

            _udpReceiver = new UdpClient(udpReceivePort);
            _udpSender = new UdpClient();

            Task.Run(new Action(UdpReceiver));
        }

        public async void Send(MessageBase message)
        {
            var msg = message as LanMessage;
            if (msg == null)
                throw new Exception("Invalid message!");

            byte[] bytes = null;
            using (var mem = new MemoryStream())
            using (var write = new BinaryWriter(mem))
            {
                message.GetStream(write);
                bytes = mem.ToArray();
            }

            if (msg.RemoteIPAddress == IPAddress.Broadcast)
            {
                var host = Dns.GetHostEntryAsync(Dns.GetHostName()).GetAwaiter().GetResult();

                foreach (var address in host.AddressList.Where(a => a.AddressFamily == AddressFamily.InterNetwork))
                {
                    var ip = address.GetAddressBytes();
                    ip[3] = 255;
                    var endPoint = new IPEndPoint(new IPAddress(ip), UdpSendPort);

                    await _udpSender.SendAsync(bytes, bytes.Length, endPoint);
                }
            }
            else
            {
                using (var client = new TcpClient(AddressFamily.InterNetwork))
                {
                    await client.ConnectAsync(msg.RemoteIPAddress, TcpSendPort);

                    client.Client.Send(bytes);
                }
            }
        }

        private async void UdpReceiver()
        {
            while (true)
            {
                var receive = await _udpReceiver.ReceiveAsync();

                using (var reader = new BinaryReader(new MemoryStream(receive.Buffer)))
                {
                    var message = new LanMessage(reader);
                    message.Parse();
                    message.RemoteIPAddress = receive.RemoteEndPoint.Address;

                    if (message.Type == MessageType.Nop)
                        return;

                    Receiver?.Invoke(message);
                }
            }
        }

        private async void TcpReceiver()
        {
            _tcpReceiver.Start();

            while (true)
            {
                var client = await _tcpReceiver.AcceptTcpClientAsync();

                Task.Run(() => TcpClientReceiver(client));
            }
        }

        private void TcpClientReceiver(TcpClient client)
        {
            while (client.Connected)
            {
                var buffer = new byte[client.ReceiveBufferSize];
                var receive = client.Client.Receive(buffer);
                if (!client.Connected)
                    break;

                if (receive > 0)
                {
                    var memoryStream = new MemoryStream(buffer, 0, receive);

                    using (var reader = new BinaryReader(memoryStream))
                    {
                        var message = new LanMessage(reader);
                        message.Parse();
                        message.RemoteIPAddress = ((IPEndPoint)client.Client.RemoteEndPoint).Address;

                        if (message.Type == MessageType.Nop)
                            return;

                        Receiver?.Invoke(message);
                    }
                }
            }
        }
    }
}