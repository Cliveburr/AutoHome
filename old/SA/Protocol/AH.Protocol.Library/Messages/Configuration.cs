using System.Text;
using System.IO;
using System;

namespace AH.Protocol.Library.Messages
{
    public class ConfigurationReadRequest : IContentMessage
    {
        public MessageType Type { get { return MessageType.ConfigurationReadRequest; } }

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }

    public class ConfigurationReadResponse : IContentMessage
    {
        public MessageType Type { get { return MessageType.ConfigurationReadResponse; } }
        public string WifiName { get; set; }
        public string WifiPassword { get; set; }
        public string Alias { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write((byte)WifiName.Length);
            stream.Write(Encoding.UTF8.GetBytes(WifiName));

            stream.Write((byte)WifiPassword.Length);
            stream.Write(Encoding.UTF8.GetBytes(WifiPassword));

            stream.Write((byte)Alias.Length);
            stream.Write(Encoding.UTF8.GetBytes(Alias));
        }

        public void Read(BinaryReader stream)
        {
            var wifiNameLen = (int)stream.ReadByte();
            WifiName = Encoding.UTF8.GetString(stream.ReadBytes(wifiNameLen));

            var wifiPassLen = (int)stream.ReadByte();
            WifiPassword = Encoding.UTF8.GetString(stream.ReadBytes(wifiPassLen));

            var aliasLen = (int)stream.ReadByte();
            Alias = Encoding.UTF8.GetString(stream.ReadBytes(aliasLen));
        }
    }

    public class ConfigurationSaveRequest : IContentMessage
    {
        public MessageType Type { get { return MessageType.ConfigurationSaveRequest; } }
        public string WifiName { get; set; }
        public string WifiPassword { get; set; }
        public string Alias { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write((byte)WifiName.Length);
            stream.Write(Encoding.UTF8.GetBytes(WifiName));

            stream.Write((byte)WifiPassword.Length);
            stream.Write(Encoding.UTF8.GetBytes(WifiPassword));

            stream.Write((byte)Alias.Length);
            stream.Write(Encoding.UTF8.GetBytes(Alias));
        }

        public void Read(BinaryReader stream)
        {
            var wifiNameLen = (int)stream.ReadByte();
            WifiName = Encoding.UTF8.GetString(stream.ReadBytes(wifiNameLen));

            var wifiPassLen = (int)stream.ReadByte();
            WifiPassword = Encoding.UTF8.GetString(stream.ReadBytes(wifiPassLen));

            var aliasLen = (int)stream.ReadByte();
            Alias = Encoding.UTF8.GetString(stream.ReadBytes(aliasLen));
        }
    }
}