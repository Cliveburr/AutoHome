
using AH.Protocol.Library;
using AH.Protocol.Library.Connection;
using AH.Protocol.Library.Messages.AutoHome;
using AH.Protocol.Library.Messages;
using System.Net;
using AH.Interfaces.Api.Services;
using AH.Interfaces.Api.Controllers.Module;
using System.Threading.Tasks;
using System.Threading;
using System.Collections.Concurrent;

namespace AH.Interfaces.Api.Service
{
    public class ConnectionService
    {
        public UdpConnection UdpConnection { get; private set; }
        public List<DiscoveryModuleModel> Modules { get; private set; }

        private readonly byte _my_uid;
        private readonly int _send_port;
        private readonly int _receive_port;
        private Dictionary<byte, TaskCompletionSource> _waitingFor;

        public ConnectionService(IConfiguration config)
        {
            _my_uid = config.GetValue<byte>("MyUID");
            _send_port = config.GetValue<int>("SendPort");
            _receive_port = config.GetValue<int>("ReceivePort");
            _waitingFor = new Dictionary<byte, TaskCompletionSource>();

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

            var alreadyHas = Modules
                .FirstOrDefault(m => m.UID == message.From_UID);
            if (alreadyHas != null)
            {
                alreadyHas.Alias = content.Alias;
                alreadyHas.ModuleType = content.ModuleType;
                alreadyHas.IpString = address.ToString();
                alreadyHas.Ip = address;
                alreadyHas.OnTime = DateTime.UtcNow;
            }
            else
            {
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

            lock (_waitingFor)
            {
                if (_waitingFor.ContainsKey(message.From_UID))
                {
                    _waitingFor[message.From_UID].SetResult();
                }
            }
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

        public TcpConnection ConnectTCP(byte uid)
        {
            var mod = Modules
                .FirstOrDefault(m => m.UID == uid);
            if (mod == null)
            {
                throw new Exception("Not found!");
            }

            return new TcpConnection(_my_uid, mod.UID, mod.Ip, _send_port);
        }

        public async Task<DiscoveryModuleModel?> RefreshModulesAndWaitFor(byte uid)
        {
            Modules.Clear();
            UdpConnection.SendBroadcast(new PingRequest());

            var waitingFor = new TaskCompletionSource();
            _waitingFor.Add(uid, waitingFor);

            var completed = await Task.WhenAny(waitingFor.Task, Task.Delay(60000));
            lock (_waitingFor)
            {
                _waitingFor.Remove(uid);
            }
            if (completed == waitingFor.Task)
            {
                return Modules
                    .Where(m => m.UID == uid)
                    .FirstOrDefault();
            }
            else
            {
                return null;
            }
        }
    }
}
