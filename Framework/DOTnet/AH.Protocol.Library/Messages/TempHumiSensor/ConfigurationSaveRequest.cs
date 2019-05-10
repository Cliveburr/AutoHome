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
        public byte PointToOff { get; set; }
        public byte PointToOn { get; set; }
        public ushort ReadInverval { get; set; }

        public void Read(BinaryReader stream)
        {
            PointToOff = stream.ReadByte();

            PointToOn = stream.ReadByte();

            ReadInverval = stream.ReadUInt16();
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(PointToOff);

            stream.Write(PointToOn);

            stream.Write(ReadInverval);
        }
    }
}