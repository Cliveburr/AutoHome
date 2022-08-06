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
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.UIDSaveRequest;
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

    public class UIDSaveResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.UIDSaveResponse;

        public void Write(BinaryWriter stream)
        {
        }

        public void Read(BinaryReader stream)
        {
        }
    }
}