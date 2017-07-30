using AH.Module.Controller.Protocol;
using System.Text;
using System.IO;

namespace AH.Module.Controller.Messages.AutoHome
{
    public class PingSendMessage : SendMessage
    {
        public PingSendMessage(byte UID, string ip)
            : base(UID, ip, MessageType.Ping)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
            writer.Write("PING");
        }
    }

    public class PongReceiveMessage : IReceiveContent
    {
        public string Content { get; set; }

        public void Parse(BinaryReader reader)
        {
            Content = Encoding.UTF8.GetString(reader.ReadBytes(4));
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