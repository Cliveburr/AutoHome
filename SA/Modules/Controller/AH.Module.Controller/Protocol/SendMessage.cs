using System.IO;
using System.Net;

namespace AH.Module.Controller.Protocol
{
    public abstract class SendMessage
    {
        public byte UID { get; set; }
        public MessageType Type { get; set; }

        public SendMessage(byte UID, MessageType type)
        {
            this.UID = UID;
            Type = type;
        }

        public byte[] GetBytes()
        {
            using (var mem = new MemoryStream())
            using (var writer = new BinaryWriter(mem))
            {
                writer.Write(UID);

                writer.Write((byte)Type);

                WriteContent(writer);

                return mem.ToArray();
            }
        }

        protected abstract void WriteContent(BinaryWriter writer);
    }
}