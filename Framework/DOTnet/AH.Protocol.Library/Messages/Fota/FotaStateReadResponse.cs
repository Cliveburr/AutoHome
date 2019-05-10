﻿using System.IO;

namespace AH.Protocol.Library.Messages.Fota
{
    public class FotaStateReadResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.Fota;
        public byte Msg { get; } = (byte)FotaMessageType.StateReadResponse;
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
}