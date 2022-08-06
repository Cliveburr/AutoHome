using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public static class BinaryExtension
    {
        public static string ReadDirectString(this BinaryReader stream, int count)
        {
            return Encoding.UTF8.GetString(stream.ReadBytes(count));
        }

        public static void WriteDirectString(this BinaryWriter stream, string text)
        {
            stream.Write(Encoding.UTF8.GetBytes(text));
        }

        public static string ReadString(this BinaryReader stream)
        {
            var len = (int)stream.ReadByte();
            return Encoding.UTF8.GetString(stream.ReadBytes(len));
        }

        public static void WriteString(this BinaryWriter stream, string text)
        {
            stream.Write((byte)text.Length);
            stream.Write(Encoding.UTF8.GetBytes(text));
        }
    }
}
