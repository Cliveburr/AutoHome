using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.Fota
{
    public class FotaWriteRequest : IContentMessage
    {
        public byte Port { get; } = 2;
        public byte Msg { get; } = 4;
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
}