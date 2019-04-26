using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.Fota
{
    public class FotaStartRequest : IContentMessage
    {
        public byte Port { get; } = 2;
        public byte Msg { get; } = 3;
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
}