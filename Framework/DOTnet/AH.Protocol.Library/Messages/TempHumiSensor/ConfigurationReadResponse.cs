using AH.Protocol.Library.Helpers;
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

        private byte _generalConfig;
        public int GeneralConfig_IntervalActive = 0;
        public int GeneralConfig_TemperatureSwitch = 1;
        public int GeneralConfig_HumiditySwitch = 2;
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

        public bool TemperatureSwitch
        {
            get { return BitFields.ReadBool(_generalConfig, GeneralConfig_TemperatureSwitch); }
            set { BitFields.SetBool(ref _generalConfig, GeneralConfig_TemperatureSwitch, value); }
        }

        public bool HumiditySwitch
        {
            get { return BitFields.ReadBool(_generalConfig, GeneralConfig_HumiditySwitch); }
            set { BitFields.SetBool(ref _generalConfig, GeneralConfig_HumiditySwitch, value); }
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