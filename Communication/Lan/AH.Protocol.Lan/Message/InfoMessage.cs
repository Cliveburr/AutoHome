using AH.Protocol.Library;
using AH.Protocol.Library.Module;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Lan
{
    public class InfoMessage
    {
        public ModuleType ModuleType { get; set; }

        public InfoMessage()
        {
        }

        public InfoMessage(ModuleType moduleType)
        {
            ModuleType = moduleType;
        }

        public byte[] GetBytes()
        {
            using (var mem = new MemoryStream())
            {
                mem.WriteByte((byte)ModuleType);

                return mem.ToArray();
            }
        }

        public static InfoMessage Parse(byte[] bytes)
        {
            using (var mem = new MemoryStream(bytes))
            {
                var moduleTypeBytes = new byte[1];
                mem.Read(moduleTypeBytes, 0, 1);
                var moduleType = (ModuleType)moduleTypeBytes[0];

                return new InfoMessage
                {
                    ModuleType = moduleType
                };
            }
        }

        public override string ToString()
        {
            return $@"InfoMessage {{ ModuleType = {ModuleType} }}";
        }
    }
}