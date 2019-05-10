using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.Fota
{
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