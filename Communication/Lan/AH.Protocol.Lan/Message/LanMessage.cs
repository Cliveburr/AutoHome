using AH.Protocol.Library.Message;
using System.IO;
using System.Net;

namespace AH.Protocol.Lan.Message
{
    public class LanMessage : Library.Message.MessageBase
    {
        public IPAddress RemoteIPAddress { get; set; }

        public LanMessage(BinaryReader stream)
            : base(stream)
        {
        }

        public LanMessage(ushort receiverUID, IPAddress remoteIPAddress, MessageType type, IContentMessage content = null)
            : base(receiverUID, type, content)
        {
            RemoteIPAddress = remoteIPAddress;
        }

        public override void GetStream(BinaryWriter stream)
        {
            // Data from MessageBase
            base.GetStream(stream);

            // Data from LanMessage

            // Data from content
            Content?.GetStream(stream);
        }

        public override void Parse()
        {
            // Data from MessageBase
            base.Parse();

            // Data from LanMessage
        }
    }
}