using System.IO;

namespace AH.Protocol.Library.Messages.AutoHome
{
    public class PingRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.PingRequest;
        public string Check { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.WriteDirectString("PING");
        }

        public void Read(BinaryReader stream)
        {
            Check = stream.ReadDirectString(4);
        }
    }

    public class PongResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.PongResponse;
        public ModuleType ModuleType { get; set; }
        public string Check { get; set; }
        public string Alias { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.WriteDirectString("PONG");

            stream.Write((byte)ModuleType);

            stream.WriteString(Alias);
        }

        public void Read(BinaryReader stream)
        {
            Check = stream.ReadDirectString(4);

            ModuleType = (ModuleType)stream.ReadByte();

            Alias = stream.ReadString();
        }
    }
}