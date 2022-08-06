using System.IO;

namespace AH.Protocol.Library.Messages.Fota
{
    public class StartRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.Fota;
        public byte Msg { get; } = (byte)FotaMessageType.StartRequest;
        public uint FileSize { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(FileSize);
        }

        public void Read(BinaryReader stream)
        {
            FileSize = stream.ReadUInt32();
        }
    }

    public class StartResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.Fota;
        public byte Msg { get; } = (byte)FotaMessageType.StartResponse;

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }
}