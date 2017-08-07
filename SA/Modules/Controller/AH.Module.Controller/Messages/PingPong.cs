using AH.Module.Controller.Protocol;
using System.Text;
using System.IO;

namespace AH.Module.Controller.Messages
{
    public class PingSendMessage : SendMessage
    {
        public PingSendMessage(byte UID)
            : base(UID, MessageType.Ping)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
            writer.Write(Encoding.UTF8.GetBytes("PING"));
        }
    }

    public class PongReceiveMessage : IReceiveContent
    {
        public string Content { get; set; }
        public string Alias { get; set; }

        public MessageType Type { get { return MessageType.Pong; } }

        public void Parse(BinaryReader reader)
        {
            Content = Encoding.UTF8.GetString(reader.ReadBytes(4));

            var aliasLen = (int)reader.ReadByte();
            Alias = Encoding.UTF8.GetString(reader.ReadBytes(aliasLen));
        }

        public bool IsValid
        {
            get
            {
                return Content == "PONG";
            }
        }
    }
}