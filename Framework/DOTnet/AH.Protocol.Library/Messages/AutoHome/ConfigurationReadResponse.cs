using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.AutoHome
{
    public class ConfigurationReadResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.ConfigurationReadResponse;
        public string WifiName { get; set; }
        public string WifiPassword { get; set; }
        public string Alias { get; set; }
        public string Category { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write((byte)WifiName.Length);
            stream.Write(Encoding.UTF8.GetBytes(WifiName));

            stream.Write((byte)WifiPassword.Length);
            stream.Write(Encoding.UTF8.GetBytes(WifiPassword));

            stream.Write((byte)Alias.Length);
            stream.Write(Encoding.UTF8.GetBytes(Alias));

            stream.Write((byte)Category.Length);
            stream.Write(Encoding.UTF8.GetBytes(Category));
        }

        public void Read(BinaryReader stream)
        {
            var wifiNameLen = (int)stream.ReadByte();
            WifiName = Encoding.UTF8.GetString(stream.ReadBytes(wifiNameLen));

            var wifiPassLen = (int)stream.ReadByte();
            WifiPassword = Encoding.UTF8.GetString(stream.ReadBytes(wifiPassLen));

            var aliasLen = (int)stream.ReadByte();
            Alias = Encoding.UTF8.GetString(stream.ReadBytes(aliasLen));

            var categoryLen = (int)stream.ReadByte();
            Category = Encoding.UTF8.GetString(stream.ReadBytes(categoryLen));
        }
    }
}