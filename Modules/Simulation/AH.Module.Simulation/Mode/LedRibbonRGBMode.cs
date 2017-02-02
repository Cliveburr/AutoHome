using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AH.Protocol.Library;
using AH.Protocol.Lan;
using System.Net;
using AH.Protocol.Library.Module.LedRibbonRGB;
using AH.Protocol.Library.Module;
using AH.Protocol.Library.Value;

namespace AH.Module.Simulation.Mode
{
    public class LedRibbonRGBMode : ModeBase
    {
        public RgbLightValue State { get; set; }

        public LedRibbonRGBMode()
        {
            State = new RgbLightValue
            {
                Red = 0,
                Green = 0,
                Blue = 0
            };
        }

        protected override void AutoHome_Receiver(MessageBase message)
        {
            Console.WriteLine("Message income:");
            Console.WriteLine(message.ToString());

            var lanMsg = message as LanMessage;

            switch (lanMsg.Type)
            {
                case LanMessageType.InfoRequest: SendInfoRequest(lanMsg); break;
                case LanMessageType.ModuleMessage: ProcessModuleMessage(lanMsg); break;
            }
        }

        private void ProcessModuleMessage(LanMessage message)
        {
            var moduleMsg = LedribbonRGBMessage.Parse(message.MessageBody);
            switch (moduleMsg.Type)
            {
                case LedribbonRGBMessageType.StateRequest: SendResponseState(message); break;
                case LedribbonRGBMessageType.StateChange: ProcessChangeState(message, moduleMsg); break;
            }
        }

        protected override void OnStarted()
        {
            SendBroadcastInfoResponse();
        }

        private void SendBroadcastInfoResponse()
        {
            var info = new InfoMessage(ModuleType.LedRibbonRgb);
            var response = new LanMessage(0, IPAddress.Broadcast, LanMessageType.InfoResponse, info.GetBytes());
            AutoHome.Send(response);
        }

        private void SendInfoRequest(LanMessage message)
        {
            var info = new InfoMessage(ModuleType.LedRibbonRgb);
            var response = new LanMessage(message.SenderUID, message.SenderIPAddress, LanMessageType.InfoResponse, info.GetBytes());
            AutoHome.Send(response);
        }

        private void SendResponseState(LanMessage message)
        {
            var moduleMsg = LedribbonRGBMessage.CreateStateResponse(State);
            var response = new LanMessage(message.SenderUID, message.SenderIPAddress, LanMessageType.ModuleMessage, moduleMsg.GetBytes());
            AutoHome.Send(response);
        }

        private void ProcessChangeState(LanMessage message, LedribbonRGBMessage moduleMsg)
        {
            State = moduleMsg.State;
            Console.WriteLine("State changed");
            Console.WriteLine(State.ToString());
        }
    }
}