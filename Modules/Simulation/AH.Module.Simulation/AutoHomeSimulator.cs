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
        public UdpConnection UdpConnection { get; private set; }
        public TcpConnection TcpConnection { get; private set; }

        private async void ReceiveTcp()
        {
            var listener = new TcpListener(IPAddress.Any, SendPort);
            listener.Start();
            var clientTasks = new TaskFactory();

            while (true)
            {
                var client = await listener.AcceptTcpClientAsync();

                var clientTask = clientTasks.StartNew(ReceiveTcpClient, client);
            }
        }

        public void Start()
        {
            UdpConnection = new UdpConnection();
            UdpConnection.OnUdpReceived += _udpConnection_OnUdpReceived;
            UdpConnection.StartSender(SendPort);
            UdpConnection.StartReceiver(ReceivePort);

            TcpConnection = new TcpConnection();
            TcpConnection.OnTcpReceived += TcpConnection_OnTcpReceived;
            TcpConnection.StartReceiver(SendPort);
        }

        private void TcpConnection_OnTcpReceived(TcpClient client, Message message)
        {
        }

        private void _udpConnection_OnUdpReceived(IPAddress address, Message message)
        {
            Program.Log("Udp Received");

            switch (message.Port)
            {
                case PortType.AutoHome: AutoHomePort.Instance.OnUdpReceived(address, message); break;
            }
        }

        private void ReceiveTcpClient(object obj)
        {
            //var tcp = obj as TcpClient;
            ////var stream = tcp.GetStream();

            //while (tcp.Connected)
            //{
            //    using (var mem = new MemoryStream())
            //    using (var writer = new BinaryWriter(mem))
            //    {
            //        do
            //        {
            //            var receiveBuffer = new byte[1024];
            //            var received = tcp.Client.Receive(receiveBuffer, SocketFlags.None);
            //            writer.Write(receiveBuffer, 0, received);
            //        } while (tcp.Available > 0);
            //        var buffer = mem.ToArray();
            //        if (buffer.Length > 0)
            //            OnTcpReceived?.Invoke(tcp, new Message(buffer));
            //    }
            //}
        }

        public void Dispose()
        {
            //_tcpReceive.Dispose();
        }
    }
}