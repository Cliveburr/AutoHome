using AH.Protocol.Library;
using AH.Protocol.Library.Messages.CellingFan;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public class CellingFanPort
    {
        private static CellingFanPort _instance;
        public static CellingFanPort Instance { get; } = _instance ?? new CellingFanPort();
        public bool Light { get; set; }
        public bool Fan { get; set; }
        public bool FanUp { get; set; }
        public FanSpeedEnum FanSpeed { get; set; }

        private CellingFanPort()
        {
        }

        public IContentMessage OnReceived(Message message)
        {
            switch (message.Msg)
            {
                case (byte)CellingFanMessageType.StateReadRequest: return HandleStateRead(message);
                case (byte)CellingFanMessageType.StateSaveRequest: return HandleStateSave(message);
                default: return null;
            }
        }

        private IContentMessage HandleStateRead(Message message)
        {
            Program.Log("HandleStateRead");

            var _ = message.ReadContent<StateReadRequest>();

            return new StateReadResponse
            {
                Light = Light,
                Fan = Fan,
                FanUp = FanUp,
                FanSpeed = FanSpeed
            };
        }

        private IContentMessage HandleStateSave(Message message)
        {
            Program.Log("HandleStateSave");

            var content = message.ReadContent<StateSaveRequest>();

            if (content.SetLight)
            {
                Program.Log("Set light to: " + content.Light.ToString());
                Light = content.Light;
            }

            if (content.SetFan)
            {
                Program.Log("Set fan to: " + content.Fan.ToString());
                Fan = content.Fan;
            }

            if (content.SetFanUp)
            {
                Program.Log("Set fa up to: " + content.FanUp.ToString());
                FanUp = content.FanUp;
            }

            if (content.FanSpeed != FanSpeedEnum.NotSet)
            {
                Program.Log("Set fan speed to: " + content.FanSpeed.ToString());
                FanSpeed = content.FanSpeed;
            }

            return new StateSaveResponse();
        }
    }
}
