using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public abstract class MessageBase
    {
        public ushort SenderUID { get; set; }
        public ushort ReceiverUID { get; set; }
        public byte[] MessageBody { get; set; }

        protected abstract byte[] GetPhysicalBytes();
        protected abstract void ParseBytes(MemoryStream mem);

        public MessageBase(ushort receiverUID, byte[] messageBody)
        {
            ReceiverUID = receiverUID;
            MessageBody = messageBody;
        }

        public MessageBase(byte[] bytes)
        {
            using (var mem = new MemoryStream(bytes))
            {
                var senderUIDBytes = new byte[2];
                mem.Read(senderUIDBytes, 0, 2);
                SenderUID = BitConverter.ToUInt16(senderUIDBytes, 0);

                var receiverUIDBytes = new byte[2];
                mem.Read(receiverUIDBytes, 0, 2);
                ReceiverUID = BitConverter.ToUInt16(receiverUIDBytes, 0);

                var fullMessageBodyBytes = new byte[2];
                mem.Read(fullMessageBodyBytes, 0, 2);
                var fullMessageBodyLength = BitConverter.ToUInt16(fullMessageBodyBytes, 0);

                if (fullMessageBodyLength != bytes.Length - 6)
                    throw new Exception("MessageBodyLength differ from the buffer!");

                ParseBytes(mem);

                MessageBody = new byte[bytes.Length - mem.Position];
                mem.Read(MessageBody, 0, MessageBody.Length);
            }
        }

        public byte[] GetBytes()
        {
            using (var mem = new MemoryStream())
            {
                var senderUIDBytes = BitConverter.GetBytes(SenderUID);
                mem.Write(senderUIDBytes, 0, senderUIDBytes.Length);

                var receiverUIDBytes = BitConverter.GetBytes(ReceiverUID);
                mem.Write(receiverUIDBytes, 0, receiverUIDBytes.Length);

                var physicalBytes = GetPhysicalBytes();
                var fullMessageBodyLength = (ushort)(physicalBytes.Length + MessageBody.Length);

                var totalBytes = BitConverter.GetBytes(fullMessageBodyLength);
                mem.Write(totalBytes, 0, totalBytes.Length);

                mem.Write(physicalBytes, 0, physicalBytes.Length);

                mem.Write(MessageBody, 0, MessageBody.Length);

                return mem.ToArray();
            }
        }
    }
}