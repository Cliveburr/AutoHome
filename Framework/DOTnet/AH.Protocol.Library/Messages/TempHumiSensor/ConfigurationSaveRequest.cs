using AH.Protocol.Library.Helpers;
using AH.Protocol.Library.Messages.TempHumiSensor.BitMappers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor
{
    public class ConfigurationSaveRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.TempHumiSensor;
        public byte Msg { get; } = (byte)TempHumiSensorMessageType.ConfigurationSaveRequest;

        public general_config_t GeneralConfig { get; set; } = new general_config_t();
        public short TempPointToOff { get; set; }
        public short TempPointToOn { get; set; }
        public ushort HumiPointToOff { get; set; }
        public ushort HumiPointToOn { get; set; }
        public ushort ReadInverval { get; set; }

        public void Read(BinaryReader stream)
        {
            GeneralConfig.Value = stream.ReadByte();

            TempPointToOff = stream.ReadInt16();

            TempPointToOn = stream.ReadInt16();

            HumiPointToOff = stream.ReadUInt16();

            HumiPointToOn = stream.ReadUInt16();

            ReadInverval = stream.ReadUInt16();
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(GeneralConfig.Value);

            stream.Write(TempPointToOff);

            stream.Write(TempPointToOn);

            stream.Write(HumiPointToOff);

            stream.Write(HumiPointToOn);

            stream.Write(ReadInverval);
        }
    }
}