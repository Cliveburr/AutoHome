using AH.Protocol.Library.Message;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;

namespace AH.Protocol.Library.Module
{
    public class WifiConfigurationContent : IContentMessage
    {
        public const int WifinameLenght = 30;
        public const int WifipassLenght = 30;
        public string Wifiname { get; set; }
        public string Wifipass { get; set; }

        public WifiConfigurationContent()
        {
        }

        public void GetStream(BinaryWriter stream)
        {
            var nameBytes = System.Text.Encoding.UTF8.GetBytes(Wifiname);
            stream.Write((byte)nameBytes.Length);
            stream.Write(nameBytes);
            var passBytes = System.Text.Encoding.UTF8.GetBytes(Wifipass);
            stream.Write((byte)passBytes.Length);
            stream.Write(passBytes);
        }

        public void Parse(BinaryReader stream)
        {
            var nameLength = stream.ReadByte();
            var nameBytes = stream.ReadBytes(nameLength);
            Wifiname = System.Text.Encoding.UTF8.GetString(nameBytes);
            var passLength = stream.ReadByte();
            var passBytes = stream.ReadBytes(passLength);
            Wifipass = System.Text.Encoding.UTF8.GetString(passBytes);
        }
    }
}
