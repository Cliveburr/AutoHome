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
        public int WorkMode { get; set; }
        public string Wifiname { get; set; }
        public string Wifipass { get; set; }

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

            var lanMsg = message as LanMessage;

            switch (message.Type)
            {
                case MessageType.InfoRequest: SendInfoResponse(lanMsg); break;
                case MessageType.ModuleMessage: ProcessModuleMessage(lanMsg); break;
                case MessageType.WifiConfiguration: ProcessWifiConfiguration(lanMsg); break;
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
            ModuleStart();
        }

        public void ModuleStart()
        {
            if (WorkMode == 0)
            {
                SetAPMode();
            }
            else
            {
                SetStationMode();
            }
        }

        private void SetAPMode()
        {
            Console.WriteLine("Running in Access Point mode!");
            // start the ap
        }

        private void SetStationMode()
        {
            Console.WriteLine("Running in Station mode!");

            // connect to wifi
            if (true)
            {
                SendBroadcastInfoResponse();
            }
            else
            {
                SetAPMode();
            }
        }

        private void SendBroadcastInfoResponse()
        {
            Console.WriteLine("SendBroadcastInfoResponse!");

            var content = new InfoContent(ModuleType.LedRibbonRgb);
            var response = new LanMessage(0, IPAddress.Broadcast, MessageType.InfoResponse, content);
            AutoHome.Send(response);
        }

        private void SendInfoResponse(LanMessage message)
        {
            Console.WriteLine("SendInfoResponse!");

            var content = new InfoContent(ModuleType.LedRibbonRgb);
            var response = new LanMessage(message.SenderUID, message.RemoteIPAddress, MessageType.InfoResponse, content);
            AutoHome.Send(response);
        }

        private void SendResponseState(LanMessage message)
        {
            Console.WriteLine("SendResponseState!");

            var content = new LedribbonRGBContent(LedribbonRGBContentType.StateResponse,
                new LedribbonRGBStateContent(State));

            var response = new LanMessage(message.SenderUID, message.RemoteIPAddress, MessageType.ModuleMessage, content);
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

        private void ProcessWifiConfiguration(LanMessage message)
        {
            var content = new WifiConfigurationContent();
            message.ParseContent(content);

            Console.WriteLine("WifiConfiguration");
            Console.WriteLine($"Wifiname: {content.Wifiname}");
            Console.WriteLine($"Wifipass: {content.Wifipass}");

            Wifiname = content.Wifiname;
            Wifipass = content.Wifipass;

            WorkMode = 1;

            Console.WriteLine("Restarting...");
            ModuleStart();
        }
    }
}