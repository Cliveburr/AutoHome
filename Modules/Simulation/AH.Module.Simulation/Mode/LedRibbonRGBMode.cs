using System;
using AH.Protocol.Lan;
using System.Net;
using AH.Protocol.Library.Module.LedRibbonRGB;
using AH.Protocol.Library.Module;
using AH.Protocol.Library.Value;
using AH.Protocol.Library.Message;
using AH.Protocol.Lan.Message;

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

            switch (message.Type)
            {
                case MessageType.InfoRequest: SendInfoResponse(lanMsg); break;
                case MessageType.ModuleMessage: ProcessModuleMessage(lanMsg); break;
            }
        }

        private void ProcessModuleMessage(LanMessage message)
        {
            var content = new LedribbonRGBContent();
            message.ParseContent(content);

            switch (content.Type)
            {
                case LedribbonRGBContentType.StateRequest: SendResponseState(message); break;
                case LedribbonRGBContentType.StateChange: ProcessChangeState(message, content); break;
            }
        }

        protected override void OnStarted()
        {
            SendBroadcastInfoResponse();
        }

        private void SendBroadcastInfoResponse()
        {
            var content = new InfoContent(ModuleType.LedRibbonRgb);
            var response = new LanMessage(0, IPAddress.Broadcast, MessageType.InfoResponse, content);
            AutoHome.Send(response);
        }

        private void SendInfoResponse(LanMessage message)
        {
            var content = new InfoContent(ModuleType.LedRibbonRgb);
            var response = new LanMessage(message.SenderUID, message.SenderIPAddress, MessageType.InfoResponse, content);
            AutoHome.Send(response);
        }

        private void SendResponseState(LanMessage message)
        {
            var content = new LedribbonRGBContent(LedribbonRGBContentType.StateResponse,
                new LedribbonRGBStateContent(State));

            var response = new LanMessage(message.SenderUID, message.SenderIPAddress, MessageType.ModuleMessage, content);
            AutoHome.Send(response);
        }

        private void ProcessChangeState(LanMessage message, LedribbonRGBContent moduleMsg)
        {
            var content = new LedribbonRGBStateContent();
            message.ParseContent(content);

            State = content.State;
            Console.WriteLine("State changed");
            Console.WriteLine(State.ToString());
        }
    }
}