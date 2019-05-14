using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor
{
    public class ConfigurationReadResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.TempHumiSensor;
        public byte Msg { get; } = (byte)TempHumiSensorMessageType.ConfigurationReadResponse;
        public byte GeneralConfig { get; set; }
        public int GeneralConfig_Interval = 0;
        public int GeneralConfig_Temperature = 1;
        public int GeneralConfig_Humidity = 2;
        public byte TempPointToOff { get; set; }
        public byte TempPointToOn { get; set; }
        public byte HumiPointToOff { get; set; }
        public byte HumiPointToOn { get; set; }
        public ushort ReadInverval { get; set; }

        public void Read(BinaryReader stream)
        {
            GeneralConfig = stream.ReadByte();

            TempPointToOff = stream.ReadByte();

            TempPointToOn = stream.ReadByte();

            HumiPointToOff = stream.ReadByte();

            HumiPointToOn = stream.ReadByte();

            ReadInverval = stream.ReadUInt16();
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(GeneralConfig);

            stream.Write(TempPointToOff);

            stream.Write(TempPointToOn);

            stream.Write(HumiPointToOff);

            stream.Write(HumiPointToOn);

            stream.Write(ReadInverval);
        }
    }
}