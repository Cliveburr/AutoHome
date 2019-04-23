using AH.Protocol.Library.Message;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;

namespace AH.Protocol.Library.Module
{
    public class PongContent : IContentMessage
    {
        public int ApiPort { get; set; }

        public PongContent()
        {
        }

        public PongContent(int apiPort)
        {
            ApiPort = apiPort;
        }

        public void GetStream(BinaryWriter stream)
        {
            stream.Write(ApiPort);
        }

        public void Parse(BinaryReader stream)
        {
            ApiPort = stream.ReadInt16();
        }
    }
}