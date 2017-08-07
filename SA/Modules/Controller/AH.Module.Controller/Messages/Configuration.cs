using AH.Module.Controller.Protocol;
using System.Text;
using System.IO;

namespace AH.Module.Controller.Messages
{
    public class ConfigurationReadRequest : SendMessage
    {
        public ConfigurationReadRequest(byte UID)
            : base(UID, MessageType.ConfigurationReadRequest)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
        }
    }

    public class ConfigurationReadResponse : IReceiveContent
    {
        public string WifiName { get; set; }
        public string WifiPassword { get; set; }
        public string Alias { get; set; }

        public MessageType Type { get { return MessageType.ConfigurationReadResponse; } }

        public void Parse(BinaryReader reader)
        {
            var wifiNameLen = (int)reader.ReadByte();
            WifiName = Encoding.UTF8.GetString(reader.ReadBytes(wifiNameLen));

            var wifiPassLen = (int)reader.ReadByte();
            WifiPassword = Encoding.UTF8.GetString(reader.ReadBytes(wifiPassLen));

            var aliasLen = (int)reader.ReadByte();
            Alias = Encoding.UTF8.GetString(reader.ReadBytes(aliasLen));
        }
    }

    public class ConfigurationSaveRequest : SendMessage
    {
        public string WifiName { get; set; }
        public string WifiPassword { get; set; }
        public string Alias { get; set; }

        public ConfigurationSaveRequest(byte UID)
            : base(UID, MessageType.ConfigurationSaveRequest)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
            writer.Write((byte)WifiName.Length);
            writer.Write(Encoding.UTF8.GetBytes(WifiName));

            writer.Write((byte)WifiPassword.Length);
            writer.Write(Encoding.UTF8.GetBytes(WifiPassword));

            writer.Write((byte)Alias.Length);
            writer.Write(Encoding.UTF8.GetBytes(Alias));
        }
    }
}