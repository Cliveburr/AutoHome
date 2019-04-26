using System;
using System.IO;

namespace AH.Protocol.Library.Messages
{
    public class FotaStateReadRequest : IContentMessage
    {
        public byte Port { get; } = 2;
        public byte Msg { get; } = 1;

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }
}