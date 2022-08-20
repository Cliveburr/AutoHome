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
        public ModuleType ModuleType { get; set; }

        public void Start()
        {
            UdpConnection = new UdpConnection(AutoHomePort.Instance.UID, SendPort, ReceivePort);
            UdpConnection.OnUdpReceived += UdpConnection_OnUdpReceived;
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