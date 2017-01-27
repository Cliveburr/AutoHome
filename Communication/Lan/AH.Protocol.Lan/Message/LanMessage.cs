using AH.Protocol.Library;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace AH.Protocol.Lan
{
    public class LanMessage : MessageBase
    {
        public IPAddress SenderIPAddress { get; set; }
        public IPAddress ReceiverIPAddress { get; set; }
        public LanMessageType Type { get; set; }

        public LanMessage(ushort receiverUID, IPAddress receiverIPAddress, LanMessageType type, byte[] messageBody)
            : base(receiverUID, messageBody)
        {
            ReceiverIPAddress = receiverIPAddress;
            Type = type;
        }

        public LanMessage(byte[] bytes)
            : base(bytes)
        {
        }

        protected override byte[] GetPhysicalBytes()
        {
            using (var mem = new MemoryStream())
            {
                //var senderBytes = SenderIPAddress.GetAddressBytes();
                //mem.Write(senderBytes, 0, senderBytes.Length);

                //var receiverBytes = ReceiverIPAddress.GetAddressBytes();
                //mem.Write(receiverBytes, 0, receiverBytes.Length);

                mem.WriteByte((byte)Type);

                return mem.ToArray();
            }
        }

        protected override void ParseBytes(MemoryStream mem)
        {
            //var senderIPAddressBytes = new byte[4];
            //mem.Read(senderIPAddressBytes, 0, 4);
            //SenderIPAddress = new IPAddress(senderIPAddressBytes);

            //var receiverIPAddressBytes = new byte[4];
            //mem.Read(receiverIPAddressBytes, 0, 4);
            //SenderIPAddress = new IPAddress(receiverIPAddressBytes);

            var typeBytes = new byte[1];
            mem.Read(typeBytes, 0, 1);
            Type = (LanMessageType)typeBytes[0];
        }

        public override string ToString()
        {
            return $@"LanMessage
{{
    SenderUID = {SenderUID.ToString()}
    ReceiverUID = {ReceiverUID.ToString()}
    SenderIPAddress = {SenderIPAddress.ToString()}
    ReceiverIPAddress = {ReceiverIPAddress.ToString()}
    Type = {Type.ToString()}
    MessageBody = {{{string.Join(", ", MessageBody)}}}
}}";
        }
    }
}