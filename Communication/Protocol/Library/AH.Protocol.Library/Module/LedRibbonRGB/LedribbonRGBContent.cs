using AH.Protocol.Library.Message;
using AH.Protocol.Library.Value;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Module.LedRibbonRGB
{
    public class LedribbonRGBContent : IContentMessage
    {
        public LedribbonRGBContentType Type { get; private set; }
        public IContentMessage Content { get; private set; }

        public LedribbonRGBContent()
        {
        }

        public LedribbonRGBContent(LedribbonRGBContentType type, IContentMessage content = null)
        {
            Type = type;
            Content = content;
        }

        public void GetStream(BinaryWriter stream)
        {
            stream.Write((byte)Type);
            Content?.GetStream(stream);
        }

        public void Parse(BinaryReader stream)
        {
            Type = (LedribbonRGBContentType)stream.ReadByte();
        }
    }
}