using AH.Control.Api.Business;
using AH.Control.Api.Entities;
using AH.Protocol.Lan;
using AH.Protocol.Library;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace AH.Control.Api.Protocol
{
    public class AutoHomeProtocol
    {
        public AutoHomeOptions Options { get; set; }
        public ModuleComponent ModuleComponent { get; set; }
        public AhProtocol AutoHome { get; set; }
        public LanProtocol Lan { get; set; }
        public LedRibbonRGBCenter LedRibbonRgb { get; set; }

        public AutoHomeProtocol(IOptions<AutoHomeOptions> options, ModuleComponent moduleComponent)
        {
            Options = options.Value;
            ModuleComponent = moduleComponent;

            LedRibbonRgb = new LedRibbonRGBCenter(this, moduleComponent);

            Lan = new LanProtocol(Options.ReceivePort, Options.SendPort);
            AutoHome = new AhProtocol(Options.UID, Lan);
            AutoHome.Receiver += AutoHome_Receiver;
        }

        public void BroadcastInfoRequest()
        {
            var msg0 = new LanMessage(0, IPAddress.Broadcast, LanMessageType.InfoRequest, new byte[] { });
            AutoHome.Send(msg0);
        }

        public void InfoRequest(ModuleEntity entity)
        {
            var address = new IPAddress(entity.Address);
            var msg0 = new LanMessage(entity.UID, address, LanMessageType.InfoRequest, new byte[] { });
            AutoHome.Send(msg0);
        }

        private void AutoHome_Receiver(MessageBase message)
        {
            var lanMsg = message as LanMessage;
            switch (lanMsg.Type)
            {
                case LanMessageType.InfoResponse: ProcessInfoResponse(lanMsg); break;
                case LanMessageType.ModuleMessage: ProcessModuleMessage(lanMsg); break;
            }
        }

        private void ProcessInfoResponse(LanMessage message)
        {
            var info = InfoMessage.Parse(message.MessageBody);
            ModuleComponent.UpdateAddressForUID(message.SenderUID, message.SenderIPAddress, info);
        }

        private void ProcessModuleMessage(LanMessage message)
        {
            var entity = ModuleComponent.GetByUID(message.SenderUID);
            if (entity == null)
                return;

            switch (entity.Type)
            {
                case AH.Protocol.Library.Module.ModuleType.LedRibbonRgb: LedRibbonRgb.ProcessMessage(entity, message); break;
            }
        }
    }
}