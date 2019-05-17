using AH.Protocol.Library.Messages.TempHumiSensor.BitMappers;
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

        public switchs_state_t RelayStates { get; set; } = new switchs_state_t();
        public byte[] Data { get; set; }

        public void Read(BinaryReader stream)
        {
            RelayStates.Value = stream.ReadByte();

            Data = stream.ReadBytes(5);
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(RelayStates.Value);

            stream.Write(Data);
        }
    }
}