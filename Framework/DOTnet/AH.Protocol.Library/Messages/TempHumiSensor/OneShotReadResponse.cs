using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor
{
    public class OneShotReadResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.TempHumiSensor;
        public byte Msg { get; } = (byte)TempHumiSensorMessageType.OneShotReadResponse;
        public byte Temperature { get; set; }
        public byte Humidity { get; set; }
        public byte RelayState { get; set; }

        public void Read(BinaryReader stream)
        {
            Temperature = stream.ReadByte();

            Humidity = stream.ReadByte();

            RelayState = stream.ReadByte();
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Temperature);

            stream.Write(Humidity);

            stream.Write(RelayState);
        }
    }
}