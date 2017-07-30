using System.IO;

namespace AH.Module.Controller.Protocol
{
    public abstract class SendMessage
    {
        public byte UID { get; set; }
        public MessageType Type { get; set; }
        public string Ip { get; set; }

        public SendMessage(byte UID, string ip, MessageType type)
        {
            this.UID = UID;
            Ip = ip;
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