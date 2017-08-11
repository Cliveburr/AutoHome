using AH.Protocol.Library;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public class AutoHomeSimulator : AutoHome
    {
        public delegate void TcpReceived(TcpClient client, Message message);
        public event TcpReceived OnTcpReceived;

        private Task _tcpReceive;

        public AutoHomeSimulator(int sendPort, int receivePort)
            : base(sendPort, receivePort)
        {
            _tcpReceive = Task.Run((Action)ReceiveTcp);
        }

        private async void ReceiveTcp()
        {
            var listener = new TcpListener(IPAddress.Any, ReceivePort);
            listener.Start();
            var clientTasks = new TaskFactory();

            while (true)
            {
                var client = await listener.AcceptTcpClientAsync();

                var clientTask = clientTasks.StartNew(ReceiveTcpClient, client);
            }
        }

        private void ReceiveTcpClient(object obj)
        {
            var tcp = obj as TcpClient;
            //var stream = tcp.GetStream();

            while (tcp.Connected)
            {
                using (var mem = new MemoryStream())
                using (var writer = new BinaryWriter(mem))
                {
                    do
                    {
                        var receiveBuffer = new byte[1024];
                        var received = tcp.Client.Receive(receiveBuffer, SocketFlags.None);
                        writer.Write(receiveBuffer, 0, received);
                    } while (tcp.Available > 0);
                    var buffer = mem.ToArray();
                    if (buffer.Length > 0)
                        OnTcpReceived?.Invoke(tcp, new Message(buffer));
                }
            }
        }

        public override void Dispose()
        {
            _tcpReceive.Dispose();
        }
    }
}