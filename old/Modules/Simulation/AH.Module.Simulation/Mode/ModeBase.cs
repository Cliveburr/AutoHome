using AH.Protocol.Lan;
using AH.Protocol.Library;
using AH.Protocol.Library.Message;

namespace AH.Module.Simulation.Mode
{
    public abstract class ModeBase
    {
        public AhProtocol AutoHome { get; set; }
        public LanProtocol Lan { get; set; }
        public StageContext Context { get; set; }

        public void Start()
        {
            var uid = ushort.Parse(Program.Configuration["UID"]);
            var tcpSendPort = int.Parse(Program.Configuration["TCP_SendPort"]);
            var tcpReceivePort = int.Parse(Program.Configuration["TCP_ReceivePort"]);
            var udpSendPort = int.Parse(Program.Configuration["UDP_SendPort"]);
            var udpReceivePort = int.Parse(Program.Configuration["UDP_ReceivePort"]);

            Lan = new LanProtocol(tcpReceivePort, tcpSendPort, udpReceivePort, udpSendPort);
            AutoHome = new AhProtocol(uid, Lan);
            AutoHome.Receiver += AutoHome_Receiver;

            OnStarted();
        }

        protected abstract void AutoHome_Receiver(MessageBase message);

        protected abstract void OnStarted();
    }
}