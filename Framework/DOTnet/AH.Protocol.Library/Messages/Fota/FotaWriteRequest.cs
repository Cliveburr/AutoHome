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
}