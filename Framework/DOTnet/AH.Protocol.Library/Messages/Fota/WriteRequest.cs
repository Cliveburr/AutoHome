using System.IO;

namespace AH.Protocol.Library.Messages.Fota
{
    public class FotaWriteRequest : IContentMessage
    {
        public static ushort ChunkSize { get; set; }

        public PortType Port { get; } = PortType.Fota;
        public byte Msg { get; } = (byte)FotaMessageType.WriteRequest;
        public byte[] Chunk { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Chunk);
        }

        public void Read(BinaryReader stream)
        {
            Chunk = stream.ReadBytes(ChunkSize);
        }
    }

    public class FotaWriteResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.Fota;
        public byte Msg { get; } = (byte)FotaMessageType.WriteResponse;
        public bool IsOver { get; set; }

        public void Read(BinaryReader stream)
        {
            IsOver = stream.ReadByte() == 1;
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write((byte)(IsOver ? 1 : 0));
        }
    }
}