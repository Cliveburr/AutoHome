using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation.Tests.TempHumiSensor
{
    [TestClass]
    public class DataInfoTests
    {
        [TestMethod]
        public void DataInfoOneSave()
        {
            TempHumiSensorPort.Instance.temphumisensor_datainfo_load();

            TempHumiSensorPort.Instance.temphumisensor_datainfo_save(333);

            TempHumiSensorPort.Instance.temphumisensor_datainfo_load();

            Assert.AreEqual(TempHumiSensorPort.Instance.datainfo_id, (ulong)1);
            Assert.AreEqual(TempHumiSensorPort.Instance.datainfo_addr, (uint)333);
            Assert.AreEqual(TempHumiSensorPort.Instance.datainfo_checksum, (uint)334);
            Assert.AreEqual(TempHumiSensorPort.Instance.datainfo_pos, (ushort)16);
        }

        [TestMethod]
        public void DataInfoAllRangeSave()
        {
            // 4096 / 16 = 256 position

            var rnd = new Random(DateTime.Now.Millisecond);

            var id = (ulong)0;
            var addr = (uint)0;
            var checksum = (uint)0;
            var pos = (ushort)0;

            for (var i = 0; i < 2048; i++)
            {
                TempHumiSensorPort.Instance.temphumisensor_datainfo_load();

                Assert.AreEqual(TempHumiSensorPort.Instance.datainfo_id, id);
                Assert.AreEqual(TempHumiSensorPort.Instance.datainfo_addr, addr);
                Assert.AreEqual(TempHumiSensorPort.Instance.datainfo_checksum, checksum);
                Assert.AreEqual(TempHumiSensorPort.Instance.datainfo_pos, pos);

                TempHumiSensorPort.Instance.temphumisensor_datainfo_save((uint)rnd.Next(int.MinValue, int.MaxValue));

                id += 1;
                addr = TempHumiSensorPort.Instance.datainfo_addr;
                checksum = (uint)id + addr;
                pos += 16;

                if (pos + 16 >= 4096)
                {
                    pos = 0;
                }
            }
        }
    }
}