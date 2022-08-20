using AH.Protocol.Library;
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
    public class AutoHomePort
    {
        private static AutoHomePort _instance;
        public static AutoHomePort Instance { get; } = _instance ?? new AutoHomePort();

        public byte UID { get; set; }
        public string Alias { get; set; }
        public string WifiName { get; set; }
        public string WifiPassword { get; set; }

        private AutoHomePort()
        {
            Alias = "Simulator";
            WifiName = "";
            WifiPassword = "";
        }

        public IContentMessage OnReceived(Message message)
        {
            switch (message.Msg)
            {
                case (byte)AutoHomeMessageType.PingRequest: return HandlePing(message);
                case (byte)AutoHomeMessageType.ConfigurationReadRequest: return HandleConfigurationRead(message);
                case (byte)AutoHomeMessageType.ConfigurationSaveRequest: return HandleConfigurationSave(message);
                case (byte)AutoHomeMessageType.UIDSaveRequest: return HandleUIDSave(message);
                default: return null;
            }
        }

        private IContentMessage HandlePing(Message message)
        {
            Program.Log("HandlePing");

            var request = message.ReadContent<PingRequest>();

            if (request.Check != "PING")
            {
                throw new Exception("Invalid ping request!");
            }

            return new PongResponse
            {
                ModuleType = Program.Simulator.ModuleType,
                Alias = Alias
            };
        }

        private IContentMessage HandleConfigurationRead(Message message)
        {
            Program.Log("HandleConfigurationRead");

            return new ConfigurationReadResponse
            {
                Alias = Alias,
                WifiName = WifiName,
                WifiPassword = WifiPassword
            };
        }

        private IContentMessage HandleConfigurationSave(Message message)
        {
            Program.Log("HandleConfigurationSave");

            var content = message.ReadContent<ConfigurationSaveRequest>();

            Alias = content.Alias;
            WifiName = content.WifiName;
            WifiPassword = content.WifiPassword;

            return new ConfigurationSaveResponse();
        }

        private IContentMessage HandleUIDSave(Message message)
        {
            Program.Log("HandleUIDSave");

            var content = message.ReadContent<UIDSaveRequest>();

            UID = content.UID;
            Program.Simulator.UdpConnection.My_UID = UID;

            return new UIDSaveResponse();
        }
    }
}