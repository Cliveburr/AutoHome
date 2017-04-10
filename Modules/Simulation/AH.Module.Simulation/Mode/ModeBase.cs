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
            var sendPort = int.Parse(Program.Configuration["SendPort"]);
            var receivePort = int.Parse(Program.Configuration["ReceivePort"]);

            Lan = new LanProtocol(receivePort, sendPort);
            AutoHome = new AhProtocol(uid, Lan);
            AutoHome.Receiver += AutoHome_Receiver;

            OnStarted();
        }

        protected abstract void AutoHome_Receiver(MessageBase message);

        protected abstract void OnStarted();
    }
}