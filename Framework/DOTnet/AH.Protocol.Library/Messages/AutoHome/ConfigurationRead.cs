using System.IO;

namespace AH.Protocol.Library.Messages.AutoHome
{
    public class ConfigurationReadRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.ConfigurationReadRequest;

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }

    public class ConfigurationReadResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.ConfigurationReadResponse;
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