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
        public int ReceivePort { get; private set; }
        public int SendPort { get; private set; }

        private UdpClient _receiver;
        private UdpClient _sender;
        private IPAddress _myIp;

        public LanProtocol(int receivePort, int sendPort)
        {
            ReceivePort = receivePort;
            SendPort = sendPort;

            _receiver = new UdpClient(receivePort);
            _sender = new UdpClient();

            Task.Run(new Action(Receive));
        }

        public async void Send(MessageBase message)
        {
            var msg = message as LanMessage;
            if (msg == null)
                throw new Exception("Invalid message!");

            msg.SenderIPAddress = LocalIPAddress();

            var ip = new IPEndPoint(msg.ReceiverIPAddress, SendPort);

            using (var mem = new MemoryStream())
            using (var write = new BinaryWriter(mem))
            {
                message.GetStream(write);
                byte[] bytes = mem.ToArray();
                await _sender.SendAsync(bytes, bytes.Length, ip);
            }
        }

        private async void Receive()
        {
            while (true)
            {
                var receive = await _receiver.ReceiveAsync();

                using (var reader = new BinaryReader(new MemoryStream(receive.Buffer)))
                {
                    var message = new LanMessage(reader);
                    message.Parse();
                    message.ReceiverIPAddress = LocalIPAddress();
                    message.SenderIPAddress = receive.RemoteEndPoint.Address;

                    if (message.Type == MessageType.Nop)
                        return;

                    Receiver?.Invoke(message);
                }
            }
        }

        private IPAddress LocalIPAddress()
        {
            if (_myIp == null)
            {
                var host = Dns.GetHostEntryAsync(Dns.GetHostName()).GetAwaiter().GetResult();

                _myIp =  host
                    .AddressList
                    .FirstOrDefault(ip => ip.AddressFamily == AddressFamily.InterNetwork);
            }
            return _myIp;
        }
    }
}