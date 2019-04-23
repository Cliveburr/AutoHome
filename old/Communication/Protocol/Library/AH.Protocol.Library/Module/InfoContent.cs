using AH.Protocol.Library;
using AH.Protocol.Library.Message;
using AH.Protocol.Library.Module;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Module
{
    public class InfoContent : IContentMessage
    {
        public ModuleType ModuleType { get; set; }

        public InfoContent()
        {
        }

        public InfoContent(ModuleType moduleType)
        {
            ModuleType = moduleType;
        }

        public void GetStream(BinaryWriter stream)
        {
            stream.Write((byte)ModuleType);
        }

        public void Parse(BinaryReader stream)
        {
            ModuleType = (ModuleType)stream.ReadByte();
        }
    }
}