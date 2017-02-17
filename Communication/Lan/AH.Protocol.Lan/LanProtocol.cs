using AH.Protocol.Library;
using System;
using System.Collections.Generic;
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

            msg.SenderIPAddress = LocalIPAddress();

            var ip = new IPEndPoint(msg.ReceiverIPAddress, SendPort);
            byte[] bytes = message.GetBytes();

            await _sender.SendAsync(bytes, bytes.Length, ip);
        }

        private async void Receive()
        {
            while (true)
            {
                var receive = await _receiver.ReceiveAsync();

                var message = new LanMessage(receive.Buffer);
                message.ReceiverIPAddress = LocalIPAddress();
                message.SenderIPAddress = receive.RemoteEndPoint.Address;

                if (message.Type == LanMessageType.Nop)
                    return;

                Receiver?.Invoke(message);
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