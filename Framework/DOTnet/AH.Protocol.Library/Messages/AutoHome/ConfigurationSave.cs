using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.AutoHome
{
    public class ConfigurationSaveRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.ConfigurationSaveRequest;
        public string WifiName { get; set; }
        public string WifiPassword { get; set; }
        public string Alias { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.WriteString(WifiName);

            stream.WriteString(WifiPassword);

            stream.WriteString(Alias);
        }

        public void Read(BinaryReader stream)
        {
            WifiName = stream.ReadString();

            WifiPassword = stream.ReadString();

            Alias = stream.ReadString();
        }
    }
}