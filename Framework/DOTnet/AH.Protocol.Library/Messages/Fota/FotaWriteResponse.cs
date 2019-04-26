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
        public byte Port { get; } = 2;
        public byte Msg { get; } = 5;
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