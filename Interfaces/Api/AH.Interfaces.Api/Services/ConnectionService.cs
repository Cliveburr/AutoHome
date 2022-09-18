
using AH.Protocol.Library;
using AH.Protocol.Library.Connection;
using AH.Protocol.Library.Messages.AutoHome;
using AH.Protocol.Library.Messages;
using System.Net;
using AH.Interfaces.Api.Services;
using AH.Interfaces.Api.Controllers.Module;

namespace AH.Interfaces.Api.Service
{
    public class ConnectionService
    {
        public UdpConnection UdpConnection { get; private set; }
        public List<DiscoveryModuleModel> Modules { get; private set; }

        private readonly byte _my_uid;
        private readonly int _send_port;
        private readonly int _receive_port;

        public ConnectionService(IConfiguration config)
        {
            _my_uid = config.GetValue<byte>("MyUID");
            _send_port = config.GetValue<int>("SendPort");
            _receive_port = config.GetValue<int>("ReceivePort");

            Modules = new List<DiscoveryModuleModel>();
            UdpConnection = new UdpConnection(_my_uid, _send_port, _receive_port);
            UdpConnection.OnUdpReceived += UdpConnection_OnUdpReceived;
        }

        private void UdpConnection_OnUdpReceived(IPAddress address, Message message)
        {

            if (message.Port != PortType.AutoHome || message.Msg != (byte)AutoHomeMessageType.PongResponse)
            {
                return;
            }

            var content = message.ReadContent<PongResponse>();
            if (content.Check != "PONG")
            {
                return;
            }

            Modules.Add(new DiscoveryModuleModel
            {
                UID = message.From_UID,
                Alias = content.Alias,
                ModuleType = content.ModuleType,
                IpString = address.ToString(),
                Ip = address,
                OnTime = DateTime.UtcNow
            });
        }

        public void RefreshModulesList()
        {
            Modules.Clear();
            UdpConnection.SendBroadcast(new PingRequest());
        }

        public TcpConnection ConnectTCP(ModuleModel module)
        {
            return new TcpConnection(_my_uid, module.UID, IPAddress.Parse(module.Ip), _send_port);
        }
    }
}
