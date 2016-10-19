using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public class MessagePackage
    {
        public ushort SenderUID { get; set; }
        public ushort ReceiverUID { get; set; }
        public byte MessageID { get; set; }
        public MessageConfigurationEnum Configuration { get; set; }
        public byte[] MessageBody { get; set; }

        public MessagePackage()
        {
        }

        public MessagePackage(ushort senderUID, ushort receiverUID, byte messageID, MessageConfigurationEnum configuration, byte[] messageBody)
        {
            SenderUID = senderUID;
            ReceiverUID = receiverUID;
            MessageID = messageID;
            Configuration = configuration;
            MessageBody = messageBody;
        }

        public byte[] GetMessage()
        {
            if (MessageBody.Length > ushort.MaxValue)
            {
                throw new Exception("Invalid MessageBody size!");
            }

            var bodyLength = MessageBody.Length;
            var msg = new byte[8 + bodyLength];

            msg[0] = (byte)SenderUID;
            msg[1] = (byte)(SenderUID >> 8);

            msg[2] = (byte)ReceiverUID;
            msg[3] = (byte)(ReceiverUID >> 8);

            msg[4] = (byte)bodyLength;
            msg[5] = (byte)(bodyLength >> 8);

            msg[6] = MessageID;

            msg[7] = (byte)Configuration;

            for (var i = 0; i < bodyLength; i++)
            {
                msg[8 + i] = MessageBody[i];
            }

            return msg;
        }

        public static MessagePackage Parse(byte[] message)
        {
            if (message.Length < 8)
            {
                throw new Exception("Invalid message size!");
            }

            var senderUID = (ushort)(message[0] + (message[1] << 8));

            var receiverUID = (ushort)(message[2] + (message[3] << 8));

            var bodyLength = (ushort)(message[4] + (message[5] << 8));

            var messageID = message[6];

            var configuration = (MessageConfigurationEnum)message[7];

            if (message.Length != 8 + bodyLength)
            {
                throw new Exception("Body message error!");
            }

            var messageBody = new byte[bodyLength];

            for (var i = 0; i < bodyLength; i++)
            {
                messageBody[i] = message[i + 8];
            }

            return new MessagePackage
            {
                SenderUID = senderUID,
                ReceiverUID = receiverUID,
                MessageID = messageID,
                Configuration = configuration,
                MessageBody = messageBody
            };
        }
    }
}