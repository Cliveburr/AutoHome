using AH.Protocol.Library.Helpers;
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

        private byte _generalConfig;
        public int GeneralConfig_IntervalActive = 0;
        public int GeneralConfig_TemperatureActive = 1;
        public int GeneralConfig_HumidityActive = 2;
        public byte TempPointToOff { get; set; }
        public byte TempPointToOn { get; set; }
        public byte HumiPointToOff { get; set; }
        public byte HumiPointToOn { get; set; }
        public ushort ReadInverval { get; set; }

        public bool IntervalActive
        {
            get { return BitFields.ReadBool(_generalConfig, GeneralConfig_IntervalActive); }
            set { BitFields.SetBool(ref _generalConfig, GeneralConfig_IntervalActive, value); }
        }

        public bool TemperatureActive
        {
            get { return BitFields.ReadBool(_generalConfig, GeneralConfig_TemperatureActive); }
            set { BitFields.SetBool(ref _generalConfig, GeneralConfig_TemperatureActive, value); }
        }

        public bool HumidityActive
        {
            get { return BitFields.ReadBool(_generalConfig, GeneralConfig_HumidityActive); }
            set { BitFields.SetBool(ref _generalConfig, GeneralConfig_HumidityActive, value); }
        }

        public void Read(BinaryReader stream)
        {
            _generalConfig = stream.ReadByte();

            TempPointToOff = stream.ReadByte();

            TempPointToOn = stream.ReadByte();

            HumiPointToOff = stream.ReadByte();

            HumiPointToOn = stream.ReadByte();

            ReadInverval = stream.ReadUInt16();
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(_generalConfig);

            stream.Write(TempPointToOff);

            stream.Write(TempPointToOn);

            stream.Write(HumiPointToOff);

            stream.Write(HumiPointToOn);

            stream.Write(ReadInverval);
        }
    }
}