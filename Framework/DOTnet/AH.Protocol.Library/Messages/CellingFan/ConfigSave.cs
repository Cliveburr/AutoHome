using AH.Protocol.Library.Helpers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.CellingFan
{
    public class ConfigSaveRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.CellingFan;
        public byte Msg { get; } = (byte)CellingFanMessageType.ConfigSaveRequest;
        public bool InterruptionsOnOff { get; set; }
        public bool FW1FW2Inversion { get; set; }
        public bool FI1FI2Inversion { get; set; }

        public void Read(BinaryReader stream)
        {
            var vl = stream.ReadByte();

            InterruptionsOnOff = BitFields.ReadBool(vl, 0);
            FW1FW2Inversion = BitFields.ReadBool(vl, 1);
            FI1FI2Inversion = BitFields.ReadBool(vl, 2);
        }

        public void Write(BinaryWriter stream)
        {
            byte vl = 0;

            BitFields.SetBool(ref vl, 0, InterruptionsOnOff);
            BitFields.SetBool(ref vl, 1, FW1FW2Inversion);
            BitFields.SetBool(ref vl, 2, FI1FI2Inversion);

            stream.Write(vl);
        }
    }
}
