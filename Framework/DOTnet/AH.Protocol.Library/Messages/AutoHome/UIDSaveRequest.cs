using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.AutoHome
{
    public class UIDSaveRequest : IContentMessage
    {
        public byte Port { get; } = 1;
        public byte Msg { get; } = 6;
        public byte UID { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(UID);
        }

        public void Read(BinaryReader stream)
        {
            UID = stream.ReadByte();
        }
    }
}