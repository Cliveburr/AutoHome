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
        public string Alias { get; set; }
        public List<ConfigurationWifi> Wifis { get; set; }

        public void Write(BinaryWriter stream)
        {
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
}