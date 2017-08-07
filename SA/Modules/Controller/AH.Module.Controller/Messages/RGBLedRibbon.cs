using AH.Module.Controller.Protocol;
using System.IO;

namespace AH.Module.Controller.Messages
{
    public class RGBLedRibbonReadStateRequest : SendMessage
    {
        public RGBLedRibbonReadStateRequest(byte UID)
            : base(UID, MessageType.RGBLedRibbonReadStateRequest)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
        }
    }

    public class RGBLedRibbonReadStateResponse : IReceiveContent
    {
        public uint RedHigh { get; set; }
        public uint RedLow { get; set; }
        public uint GreenHigh { get; set; }
        public uint GreenLow { get; set; }
        public uint BlueHigh { get; set; }
        public uint BlueLow { get; set; }

        public MessageType Type { get { return MessageType.RGBLedRibbonReadStateResponse; } }

        public void Parse(BinaryReader reader)
        {
            RedLow = reader.ReadUInt32();
            RedHigh = reader.ReadUInt32();
            GreenLow = reader.ReadUInt32();
            GreenHigh = reader.ReadUInt32();
            BlueLow = reader.ReadUInt32();
            BlueHigh = reader.ReadUInt32();
        }
    }

    public class RGBLedRibbonChangeRequest : SendMessage
    {
        public uint RedHigh { get; set; }
        public uint RedLow { get; set; }
        public uint GreenHigh { get; set; }
        public uint GreenLow { get; set; }
        public uint BlueHigh { get; set; }
        public uint BlueLow { get; set; }

        public RGBLedRibbonChangeRequest(byte UID)
            : base(UID, MessageType.RGBLedRibbonChangeRequest)
        {
        }

        protected override void WriteContent(BinaryWriter writer)
        {
            writer.Write(RedLow);
            writer.Write(RedHigh);
            writer.Write(GreenLow);
            writer.Write(GreenHigh);
            writer.Write(BlueLow);
            writer.Write(BlueHigh);
        }
    }
}