using System;
using System.IO;

namespace AH.Protocol.Library.Messages.Fota
{
    public class FotaStateReadRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.Fota;
        public byte Msg { get; } = (byte)FotaMessageType.StateReadRequest;

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }
}