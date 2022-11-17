using AH.Protocol.Library.Helpers;
using System.IO;

namespace AH.Protocol.Library.Messages.CellingFan
{
    public class StateSaveRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.CellingFan;
        public byte Msg { get; } = (byte)CellingFanMessageType.StateSaveRequest;
        public bool SetLight { get; set; }
        public bool Light { get; set; }
        public bool SetFan { get; set; }
        public bool Fan { get; set; }
        public bool SetFanUp { get; set; }
        public bool FanUp { get; set; }
        public FanSpeedEnum FanSpeed { get; set; } = FanSpeedEnum.NotSet;

        public void Write(BinaryWriter stream)
        {
            byte vl = 0;

            BitFields.SetBool(ref vl, 0, SetLight);
            BitFields.SetBool(ref vl, 1, Light);
            BitFields.SetBool(ref vl, 2, SetFan);
            BitFields.SetBool(ref vl, 3, Fan);
            BitFields.SetBool(ref vl, 4, SetFanUp);
            BitFields.SetBool(ref vl, 5, FanUp);
            BitFields.SetByteIntoTwoBits(ref vl, 6, (byte)FanSpeed);

            stream.Write(vl);
        }

        public void Read(BinaryReader stream)
        {
            var vl = stream.ReadByte();

            SetLight = BitFields.ReadBool(vl, 0);
            Light = BitFields.ReadBool(vl, 1);
            SetFan = BitFields.ReadBool(vl, 2);
            Fan = BitFields.ReadBool(vl, 3);
            SetFanUp = BitFields.ReadBool(vl, 4);
            FanUp = BitFields.ReadBool(vl, 5);
            FanSpeed = (FanSpeedEnum)BitFields.ReadTwoBitsAsByte(vl, 6);
        }
    }

    public class StateSaveResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.CellingFan;
        public byte Msg { get; } = (byte)CellingFanMessageType.StateSaveResponse;
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
