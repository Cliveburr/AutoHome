using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor
{
    public class DataReadResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.TempHumiSensor;
        public byte Msg { get; } = (byte)TempHumiSensorMessageType.DataReadResponse;

        public byte[] Data { get; set; }

        public void Read(BinaryReader stream)
        {
            Data = stream.ReadBytes(83);
        }

        public void Write(BinaryWriter stream)
        {
            stream.Write(Data);
        }
    }
}