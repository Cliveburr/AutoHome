using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor
{
    public class HistoryReadRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.TempHumiSensor;
        public byte Msg { get; } = (byte)TempHumiSensorMessageType.HistoryReadRequest;

        public byte Skip { get; set; }
        public byte Take { get; set; }  // max 4

        public void Read(BinaryReader stream)
        {
            Skip = stream.ReadByte();

            Take = stream.ReadByte();
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Skip);

            stream.Write(Take);
        }
    }
}