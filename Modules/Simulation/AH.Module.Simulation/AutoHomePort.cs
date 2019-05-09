using AH.Protocol.Library;
using AH.Protocol.Library.Messages.AutoHome;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public class AutoHomePort
    {
        private static AutoHomePort _instance;
        public static AutoHomePort Instance { get; } = _instance ?? new AutoHomePort();

        public string Alias { get; set; }

        private AutoHomePort()
        {
            Alias = "Simulator";
        }

        public void OnUdpReceived(IPAddress address, Message message)
        {
            switch (message.Msg)
            {
                case (byte)AutoHomeMessageType.Ping: HandlePingRequest(address, message); break;

            }
        }

        private void HandlePingRequest(IPAddress address, Message message)
        {
            Program.Log("HandlePingRequest");

            var request = message.ReadContent<PingRequest>();

            if (!request.IsValid)
            {
                throw new Exception("Invalid ping request!");
            }

            Program.Simulator.UdpConnection.SendUdp(address, new Message(Program.UID, new PongResponse
            {
                ModuleType = ModuleType.LedRibbonRgb,
                Alias = Alias
            }));
        }
    }
}