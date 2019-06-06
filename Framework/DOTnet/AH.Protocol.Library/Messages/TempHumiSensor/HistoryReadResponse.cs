using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor
{
    public class HistoryReadResponse : IContentMessage
    {
        public PortType Port { get; } = PortType.TempHumiSensor;
        public byte Msg { get; } = (byte)TempHumiSensorMessageType.HistoryReadResponse;

        public data_package_t UnSavedData { get; set; }
        public data_package_t[] Data { get; set; }

        public void Read(BinaryReader stream)
        {
            var hasUnSaved = stream.ReadByte();
            if (hasUnSaved > 0)
            {
                var unSavedCount = stream.ReadByte();

                UnSavedData = new data_package_t();
                UnSavedData.started_timestamp = stream.ReadUInt32();
                UnSavedData.readInterval = stream.ReadUInt16();
                UnSavedData.data = stream.ReadBytes(5 * unSavedCount);
            }

            var data = new List<data_package_t>();
            var count = stream.ReadByte();

            for (var i = 0; i < count; i++)
            {
                var newData = new data_package_t();
                newData.started_timestamp = stream.ReadUInt32();
                newData.readInterval = stream.ReadUInt16();
                newData.data = stream.ReadBytes(250);
                data.Add(newData);
            }

            Data = data.ToArray();
        }

        public void Write(BinaryWriter stream)
        {
            if (UnSavedData != null)
            {
                stream.Write((byte)1);

                var unSavedCount = (byte)(UnSavedData.data.Length / 5);
                stream.Write(unSavedCount);

                stream.Write(UnSavedData.started_timestamp);
                stream.Write(UnSavedData.readInterval);
                stream.Write(UnSavedData.data);
            }
            else
            {
                stream.Write((byte)0);
            }

            var count = (byte)Data.Length;
            stream.Write(count);

            for (var i = 0; i < count; i++)
            {
                stream.Write(Data[i].started_timestamp);
                stream.Write(Data[i].readInterval);
                stream.Write(Data[i].data);
            }
        }
    }

    public class data_package_t
    {
        public uint started_timestamp { get; set; }  // 4 bytes
        public ushort readInterval { get; set; }  // 2 bytes
        public byte[] data { get; set; } // 5 * 50 = 250 bytes   (5 bytes for each sequence of total 50)
    }
}