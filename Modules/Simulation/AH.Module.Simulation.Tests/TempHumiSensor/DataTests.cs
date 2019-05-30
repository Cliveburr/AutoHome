using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation.Tests.TempHumiSensor
{
    [TestClass]
    public class DataTests
    {
        [TestMethod]
        public void DataOneSave()
        {
            TempHumiSensorPort.Instance.temphumisensor_datainfo_load();

            for (var i = 0; i < 50; i++)
            {
                TempHumiSensorPort.Instance.dht_read();

                TempHumiSensorPort.Instance.temphumisensor_data_save();
            }
        }

        [TestMethod]
        public void DataAllSave()
        {
            //  0xEB init =  962560
            // 0x400 end  = 4194304
            // area total = 3231744 bytes / 256 = 12624 slot * 50 = 631200 reads

            TempHumiSensorPort.Instance.temphumisensor_datainfo_load();

            for (var i = 0; i < 631200 * 2; i++)
            {
                TempHumiSensorPort.Instance.dht_read();

                TempHumiSensorPort.Instance.temphumisensor_data_save();
            }
        }
    }
}