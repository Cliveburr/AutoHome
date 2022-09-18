using AH.Protocol.Library;
using AH.Protocol.Library.Connection;
using AH.Protocol.Library.Messages;
using AH.Protocol.Library.Messages.AutoHome;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public class AutoHomeSimulator : IDisposable
    {
        public int SendPort { get; set; }
        public int ReceivePort { get; set; }
        public UdpConnection UdpConnection { get; private set; }
        public ModuleType ModuleType { get; set; }
        public int MaxMessageSize { get; set; }

        private TcpListener _receive;

        public class ReceiveClientData
        {
            public TcpClient TcpClient { get; set; }
            public byte[] Buffer { get; set; }
        }

        public void Start()
        {
            UdpConnection = new UdpConnection(AutoHomePort.Instance.UID, SendPort, ReceivePort);
            UdpConnection.OnUdpReceived += UdpConnection_OnUdpReceived;

            MaxMessageSize = 2048;
            _receive = new TcpListener(IPAddress.Any, ReceivePort);
            _receive.Start();
            _receive.BeginAcceptTcpClient(AcceptTcpClient, null);
        }

        private void AcceptTcpClient(IAsyncResult result)
        {
            try
            {
                var data = new ReceiveClientData
                {
                    TcpClient = _receive.EndAcceptTcpClient(result),
                    Buffer = new byte[MaxMessageSize]
                };

                if (data.TcpClient.Client.Connected)
                {
                    data.TcpClient.Client.BeginReceive(data.Buffer, 0, data.Buffer.Length, SocketFlags.None, Receive, data);
                }
            }
            catch (Exception err)
            {
            }
            finally
            {
                _receive.BeginAcceptTcpClient(AcceptTcpClient, null);
            }
        }

        private void Receive(IAsyncResult result)
        {
            var data = (ReceiveClientData)result.AsyncState;
            try
            {
                var bytes = data.TcpClient.Client.EndReceive(result);
                if (bytes > 0)
                {
                    var message = new Message(data.Buffer);
                    var response = RouteMessage(message);
                    if (response != null)
                    {
                        var responseMessage = new Message(AutoHomePort.Instance.UID, message.From_UID, response);
                        var responseBuffer = responseMessage.GetBytes();
                        data.TcpClient.Client.Send(responseBuffer, responseBuffer.Length, SocketFlags.None);
                    }
                }
            }
            catch (Exception err)
            {
            }
            finally
            {
                try
                {
                    data.TcpClient.Client.BeginReceive(data.Buffer, 0, data.Buffer.Length, SocketFlags.None, Receive, data);
                }
                catch { }
            }
        }

        private void UdpConnection_OnUdpReceived(IPAddress address, Message message)
        {
            Program.Log("Received:");

            var response = RouteMessage(message);

            if (response != null)
            {
                UdpConnection.Send(address, message.From_UID, response);
            }
        }

        private IContentMessage RouteMessage(Message message)
        {
            switch (message.Port)
            {
                case PortType.AutoHome: return AutoHomePort.Instance.OnReceived(message);
                case PortType.Fota: return FotaPort.Instance.OnReceived(message);
                case PortType.TempHumiSensor: return TempHumiSensorPort.Instance.OnReceived(message);
                case PortType.CellingFan: return CellingFanPort.Instance.OnReceived(message);
                default:
                    Program.Log($"Invalid Port: {message.Port}");
                    return null;
            }
        }

        public void Dispose()
        {
            UdpConnection?.Dispose();
        }
    }
}