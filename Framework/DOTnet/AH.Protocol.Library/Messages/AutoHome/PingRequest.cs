using System.Text;
using System.IO;

namespace AH.Protocol.Library.Messages.AutoHome
{
    public class PingRequest : IContentMessage
    {
        public byte Port { get; } = 1;
        public byte Msg { get; } = 1;
        public string Check { get; set; }

        public void Read(BinaryReader stream)
        {
            Check = Encoding.UTF8.GetString(stream.ReadBytes(4));
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Encoding.UTF8.GetBytes("PING"));
        }

        public bool IsValid
        {
            get
            {
                return Check == "PING";
            }
        }
    }
}