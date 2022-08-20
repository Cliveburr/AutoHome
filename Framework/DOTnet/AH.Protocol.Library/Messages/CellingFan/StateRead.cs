using AH.Protocol.Library.Helpers;
using System.IO;

namespace AH.Protocol.Library.Messages.CellingFan
{
    public class StateReadRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.CellingFan;
        public byte Msg { get; } = (byte)CellingFanMessageType.StateReadRequest;

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }

    public class StateReadResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.CellingFan;
        public byte Msg { get; } = (byte)CellingFanMessageType.StateReadResponse;
        public bool Light { get; set; }
        public bool Fan { get; set; }
        public bool FanUp { get; set; }
        public FanSpeedEnum FanSpeed { get; set; }

        public void Write(BinaryWriter stream)
        {
            byte vl = 0;

            BitFields.SetBool(ref vl, 0, Light);
            BitFields.SetBool(ref vl, 1, Fan);
            BitFields.SetBool(ref vl, 2, FanUp);
            BitFields.SetByteIntoTwoBits(ref vl, 3, (byte)FanSpeed);

            stream.Write(vl);
        }

        public void Read(BinaryReader stream)
        {
            var vl = stream.ReadByte();

            Light = BitFields.ReadBool(vl, 0);
            Fan = BitFields.ReadBool(vl, 1);
            FanUp = BitFields.ReadBool(vl, 2);
            FanSpeed = (FanSpeedEnum)BitFields.ReadTwoBitsAsByte(vl, 3);
        }
    }
}
