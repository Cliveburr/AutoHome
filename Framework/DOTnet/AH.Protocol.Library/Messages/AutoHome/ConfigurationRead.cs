using System.Collections.Generic;
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
        public string Alias { get; set; }
        public List<ConfigurationWifi> Wifis { get; set; }
        public int FirmwareVersion { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write((byte)1);
            stream.Write((byte)Wifis.Count);
            foreach (var wifi in Wifis)
            {
                stream.WriteString(wifi.Name);
                stream.WriteString(wifi.Password);
            }
            stream.WriteString(Alias);
        }

        public void Read(BinaryReader stream)
        {
            FirmwareVersion = stream.ReadByte();
            Wifis = new List<ConfigurationWifi>();
            var count = stream.ReadByte();
            for (var i = 0; i < count; i++)
            {
                var name = stream.ReadString();
                var password = stream.ReadString();
                Wifis.Add(new ConfigurationWifi
                {
                    Name = name,
                    Password = password
                });
            }
            Alias = stream.ReadString();
        }
    }

    public class ConfigurationWifi
    {
        public string Name { get; set; }
        public string Password { get; set; }
    }
}