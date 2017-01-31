﻿using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using AH.Protocol.Lan;
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
            Protocol = Protocol;
            ModuleComponent = moduleComponent;
        }

        public void StateRequest(ModuleEntity entity)
        {
            var moduleMsg = LedribbonRGBMessage.CreateStateRequest();
            var address = new IPAddress(entity.Address);
            var msg0 = new LanMessage(entity.UID, address, LanMessageType.ModuleMessage, moduleMsg.GetBytes());
            Protocol.AutoHome.Send(msg0);
        }

        public void BroadcastStateRequest()
        {
            var moduleMsg = LedribbonRGBMessage.CreateStateRequest();
            var msg0 = new LanMessage(0, IPAddress.Broadcast, LanMessageType.ModuleMessage, moduleMsg.GetBytes());
            Protocol.AutoHome.Send(msg0);
        }

        public void ProcessMessage(ModuleEntity entity, LanMessage message)
        {
            var moduleMsg = LedribbonRGBMessage.Parse(message.MessageBody);
            switch (moduleMsg.Type)
            {
                case LedribbonRGBMessageType.StateResponse: ProcessResponseState(entity, moduleMsg); break;
            }
        }

        private void ProcessResponseState(ModuleEntity entity, LedribbonRGBMessage moduleMsg)
        {
            entity.LedRibbonRGBState = moduleMsg.State;
            ModuleComponent.Update(entity.ModuleId, entity);
        }
    }
}