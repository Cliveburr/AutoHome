using System.Text;
using System.IO;
using System;

namespace AH.Protocol.Library.Messages
{
    public class ConfigurationReadRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = 3;

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }
}