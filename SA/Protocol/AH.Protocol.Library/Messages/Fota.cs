using System;
using System.IO;

namespace AH.Protocol.Library.Messages
{
    public class FotaStateReadRequest : IContentMessage
    {
        public MessageType Type { get { return MessageType.FotaStateReadRequest; } }

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }

    public class FotaStateReadResponse : IContentMessage
    {
        public MessageType Type { get { return MessageType.FotaStateReadResponse; } }
        public byte UserBin { get; set; }
        public ushort ChunkSize { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(UserBin);

            stream.Write(ChunkSize);
        }

        public void Read(BinaryReader stream)
        {
            UserBin = stream.ReadByte();

            ChunkSize = stream.ReadUInt16();
        }
    }

    public class FotaStartRequest : IContentMessage
    {
        public MessageType Type { get { return MessageType.FotaStartRequest; } }
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

    public class FotaWriteRequest : IContentMessage
    {
        public MessageType Type { get { return MessageType.FotaWriteRequest; } }
        public byte[] Chunk { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Chunk);
        }

        public void Read(BinaryReader stream)
        {
            Chunk = stream.ReadBytes(1);
        }
    }

    public class FotaWriteResponse : IContentMessage
    {
        public MessageType Type { get { return MessageType.FotaWriteResponse; } }
        public bool IsOver { get; set; }

        public void Read(BinaryReader stream)
        {
            IsOver = stream.ReadByte() == 1;
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write((byte)(IsOver ? 1: 0));
        }
    }
}