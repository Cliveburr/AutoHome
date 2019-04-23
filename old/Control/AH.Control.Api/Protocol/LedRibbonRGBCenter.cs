using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using AH.Protocol.Lan;
using AH.Protocol.Lan.Message;
using AH.Protocol.Library.Message;
using AH.Protocol.Library.Module.LedRibbonRGB;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace AH.Control.Api.Protocol
{
    public class LedRibbonRGBCenter
    {
        public AutoHomeProtocol Protocol { get; set; }
        public ModuleComponent ModuleComponent { get; set; }

        public LedRibbonRGBCenter(AutoHomeProtocol protocol, ModuleComponent moduleComponent)
        {
            Protocol = protocol;
            ModuleComponent = moduleComponent;
        }

        public void StateRequest(ModuleEntity entity)
        {
            var content = new LedribbonRGBContent(LedribbonRGBContentType.StateRequest);
            var address = new IPAddress(entity.Address);
            var msg = new LanMessage(entity.UID, address, MessageType.ModuleMessage, content);
            Protocol.AutoHome.Send(msg);
        }

        public void BroadcastStateRequest()
        {
            var content = new LedribbonRGBContent(LedribbonRGBContentType.StateRequest);
            var msg = new LanMessage(0, IPAddress.Broadcast, MessageType.ModuleMessage, content);
            Protocol.AutoHome.Send(msg);
        }

        public void ProcessMessage(ModuleEntity entity, LanMessage message)
        {
            var content = new LedribbonRGBContent();
            message.ParseContent(content);

            switch (content.Type)
            {
                case LedribbonRGBContentType.StateResponse: ProcessStateResponse(entity.ModuleId, message, content); break;
            }
        }

        private void ProcessStateResponse(string moduleId, LanMessage message, LedribbonRGBContent content)
        {
            var stateContent = new LedribbonRGBStateContent();
            message.ParseContent(stateContent);

            ModuleComponent.UpdateLedRibbonRgbValue(moduleId, stateContent.State);
        }

        public void SendValue(ModuleEntity entity)
        {
            var content = new LedribbonRGBContent(LedribbonRGBContentType.StateChange,
                new LedribbonRGBStateContent(entity.LedRibbonRgbState.Value));

            var address = new IPAddress(entity.Address);
            var msg = new LanMessage(entity.UID, address, MessageType.ModuleMessage, content);
            Protocol.AutoHome.Send(msg);
        }
    }
}