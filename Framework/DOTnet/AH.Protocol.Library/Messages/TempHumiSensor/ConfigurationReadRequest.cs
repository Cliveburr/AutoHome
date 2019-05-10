using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor
{
    public class ConfigurationReadRequest : IContentMessage
    {
        public PortType Port { get; } = PortType.TempHumiSensor;
        public byte Msg { get; } = (byte)TempHumiSensorMessageType.ConfigurationReadRequest;

        public void Read(BinaryReader stream)
        {
        }

        public void Write(BinaryWriter stream)
        {
        }
    }
}