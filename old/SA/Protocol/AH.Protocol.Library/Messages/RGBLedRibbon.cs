using System;
using System.IO;

namespace AH.Protocol.Library.Messages
{
    public class RGBLedRibbonReadStateRequest : IContentMessage
    {
        public MessageType Type { get { return MessageType.RGBLedRibbonReadStateRequest; } }

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }

    public class RGBLedRibbonReadStateResponse : IContentMessage
    {
        public MessageType Type { get { return MessageType.RGBLedRibbonReadStateResponse; } }
        public uint RedHigh { get; set; }
        public uint RedLow { get; set; }
        public uint GreenHigh { get; set; }
        public uint GreenLow { get; set; }
        public uint BlueHigh { get; set; }
        public uint BlueLow { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(RedLow);
            stream.Write(RedHigh);
            stream.Write(GreenLow);
            stream.Write(GreenHigh);
            stream.Write(BlueLow);
            stream.Write(BlueHigh);
        }

        public void Read(BinaryReader stream)
        {
            RedLow = stream.ReadUInt32();
            RedHigh = stream.ReadUInt32();
            GreenLow = stream.ReadUInt32();
            GreenHigh = stream.ReadUInt32();
            BlueLow = stream.ReadUInt32();
            BlueHigh = stream.ReadUInt32();
        }
    }

    public class RGBLedRibbonChangeRequest : IContentMessage
    {
        public MessageType Type { get { return MessageType.RGBLedRibbonChangeRequest; } }
        public uint RedHigh { get; set; }
        public uint RedLow { get; set; }
        public uint GreenHigh { get; set; }
        public uint GreenLow { get; set; }
        public uint BlueHigh { get; set; }
        public uint BlueLow { get; set; }

        public void Write(BinaryWriter stream)
        {
            stream.Write(RedLow);
            stream.Write(RedHigh);
            stream.Write(GreenLow);
            stream.Write(GreenHigh);
            stream.Write(BlueLow);
            stream.Write(BlueHigh);
        }

        public void Read(BinaryReader stream)
        {
            RedLow = stream.ReadUInt32();
            RedHigh = stream.ReadUInt32();
            GreenLow = stream.ReadUInt32();
            GreenHigh = stream.ReadUInt32();
            BlueLow = stream.ReadUInt32();
            BlueHigh = stream.ReadUInt32();
        }
    }
}