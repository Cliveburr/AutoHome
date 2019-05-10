using AH.Protocol.Library;
using AH.Protocol.Library.Connection;
using AH.Protocol.Library.Messages;
using AH.Protocol.Library.Messages.AutoHome;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public class AutoHomeSimulator : IDisposable
    {
        public int SendPort { get; set; }
        public int ReceivePort { get; set; }
        public int UID { get; set; }
        public UdpConnection UdpConnection { get; private set; }
        public TcpConnection TcpConnection { get; private set; }

        public void Start()
        {
            UdpConnection = new UdpConnection(UID);
            UdpConnection.OnUdpReceived += UdpConnection_OnUdpReceived;
            UdpConnection.StartSender(SendPort);
            UdpConnection.StartReceiver(ReceivePort);

            TcpConnection = new TcpConnection(UID);
            TcpConnection.OnTcpReceived += TcpConnection_OnTcpReceived;
            TcpConnection.StartReceiver(SendPort);
        }

        private void TcpConnection_OnTcpReceived(TcpClient client, Message message)
        {
            Program.Log("Tcp Received");

            IContentMessage response = null;

            switch (message.Port)
            {
                case PortType.AutoHome: response = AutoHomePort.Instance.OnTcpReceived(message); break;
                case PortType.Fota: response = FotaPort.Instance.OnTcpReceived(message); break;
            }

            if (response != null)
            {
                var msgResponse = new Message((byte)UID, response);
                var buffer = msgResponse.GetBytes();
                client.Client.Send(buffer, buffer.Length, SocketFlags.None);
            }
        }

        private void UdpConnection_OnUdpReceived(IPAddress address, Message message)
        {
            Program.Log("Udp Received");

            IContentMessage response = null;

            switch (message.Port)
            {
                case PortType.AutoHome: response = AutoHomePort.Instance.OnUdpReceived(message); break;
            }

            if (response != null)
            {
                Program.Simulator.UdpConnection.Send(address, response);
            }
        }

        public void ChangeUID(int UID)
        {
            UdpConnection.UID = UID;
            TcpConnection.UID = UID;
        }

        public void Dispose()
        {
            UdpConnection?.Dispose();
            TcpConnection?.Dispose();
        }
    }
}