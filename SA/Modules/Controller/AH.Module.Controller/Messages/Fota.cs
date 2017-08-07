using AH.Module.Controller.Protocol;
using System.IO;

namespace AH.Module.Controller.Messages
{
    public class FotaStateReadRequest : SendMessage
    {
        public FotaStateReadRequest(byte UID)
            : base(UID, MessageType.FotaStateReadRequest)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
        }
    }

    public class FotaStateReadResponse : IReceiveContent
    {
        public byte UserBin { get; set; }
        public ushort ChunkSize { get; set; }

        public MessageType Type { get { return MessageType.FotaStateReadResponse; } }

        public void Parse(BinaryReader reader)
        {
            UserBin = reader.ReadByte();

            ChunkSize = reader.ReadUInt16();
        }
    }

    public class FotaStartRequest : SendMessage
    {
        public uint FileSize { get; set; }

        public FotaStartRequest(byte UID)
            : base(UID, MessageType.FotaStartRequest)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
            writer.Write(FileSize);
        }
    }

    public class FotaWriteRequest : SendMessage
    {
        public byte[] Chunk { get; set; }

        public FotaWriteRequest(byte UID)
            : base(UID, MessageType.FotaWriteRequest)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
            writer.Write(Chunk);
        }
    }

    public class FotaWriteResponse : IReceiveContent
    {
        public bool IsOver { get; set; }

        public MessageType Type { get { return MessageType.FotaWriteResponse; } }

        public void Parse(BinaryReader reader)
        {
            IsOver = reader.ReadByte() == 1;
        }
    }
}