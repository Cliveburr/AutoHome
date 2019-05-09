using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.AutoHome
{
    public class PongResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.AutoHome;
        public byte Msg { get; } = (byte)AutoHomeMessageType.Pong;
        public ModuleType ModuleType { get; set; }
        public string Check { get; set; }
        public string Alias { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Encoding.UTF8.GetBytes("PONG"));

            stream.Write((byte)ModuleType);

            stream.Write((byte)Alias.Length);
            stream.Write(Encoding.UTF8.GetBytes(Alias));
        }

        public void Read(BinaryReader stream)
        {
            Check = Encoding.UTF8.GetString(stream.ReadBytes(4));

            ModuleType = (ModuleType)stream.ReadByte();

            var aliasLen = (int)stream.ReadByte();
            Alias = Encoding.UTF8.GetString(stream.ReadBytes(aliasLen));
        }

        public bool IsValid
        {
            get
            {
                return Check == "PONG";
            }
        }
    }
}