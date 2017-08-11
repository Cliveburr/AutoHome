using System.Text;
using System.IO;

namespace AH.Protocol.Library.Messages
{
    public class PingSendMessage : IContentMessage
    {
        public MessageType Type { get { return MessageType.Ping; } }
        public string Content { get; set; }

        public void Read(BinaryReader stream)
        {
            Content = Encoding.UTF8.GetString(stream.ReadBytes(4));
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Encoding.UTF8.GetBytes("PING"));
        }

        public bool IsValid
        {
            get
            {
                return Content == "PING";
            }
        }
    }

    public class PongReceiveMessage : IContentMessage
    {
        public MessageType Type { get { return MessageType.Pong; } }
        public ModuleType ModuleType { get; set; }
        public string Content { get; set; }
        public string Alias { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Encoding.UTF8.GetBytes("PONG"));

            stream.Write((byte)ModuleType);

            stream.Write((byte)Alias.Length);
            stream.Write(Encoding.UTF8.GetBytes(Alias));
        }

        public void Read(BinaryReader stream)
        {
            Content = Encoding.UTF8.GetString(stream.ReadBytes(4));

            ModuleType = (ModuleType)stream.ReadByte();

            var aliasLen = (int)stream.ReadByte();
            Alias = Encoding.UTF8.GetString(stream.ReadBytes(aliasLen));
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