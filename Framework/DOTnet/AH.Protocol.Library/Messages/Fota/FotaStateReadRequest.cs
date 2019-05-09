using System;
using System.IO;

namespace AH.Protocol.Library.Messages
{
    public class FotaStateReadRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.Fota;
        public byte Msg { get; } = 1;

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }
}