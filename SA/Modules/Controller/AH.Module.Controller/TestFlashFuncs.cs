using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Controller
{
    public class TestFlashFuncs
    {
        const int CONFIG_SEC_COUNT = 3;
        TestConfig[] memory;
        Random rnd = new Random(DateTime.Now.Millisecond);
        int lastPos = 0;
        TestConfig lastSave;

        public void RunTests()
        {
            memory = Enumerable.Range(0, 3)
                .Select(n => new TestConfig())
                .ToArray();

            lastSave = memory[0];

            for (var i = 0; i < 100000; i++)
            {
                Console.WriteLine(i);

                var config = Load();

                if (!lastSave.Equals(config))
                {
                    throw new Exception();
                }

                config.address = rnd.Next(int.MaxValue);

                Save(config);
                lastSave = config;
            }
        }

        void Save(TestConfig config)
        {
            var tries = 0;

            if (config.id >= 255)
            {
                config.id = 0;
                for (var i = 0; i < CONFIG_SEC_COUNT; i++)
                {
                    memory[i] = config;
                }
            }
            else
            {
                config.id++;

                var pos = lastPos;
                do
                {
                    if (pos < CONFIG_SEC_COUNT - 1)
                        pos++;
                    else
                        pos = 0;

                    memory[pos] = config;

                    tries++;

                } while (SimuleSaveError() && tries < CONFIG_SEC_COUNT - 1);  //result != SPI_FLASH_RESULT_OK
            }
        }

        bool SimuleSaveError()
        {
            var err = rnd.Next(0, 100) > 98;
            if (err)
            {
                Console.WriteLine("SimuleSaveError");
            }
            return err;
        }

        TestConfig Load()
        {
            TestConfig config = null;
            var pos = 0;
            var id = 0;

            for (var i = 0; i < CONFIG_SEC_COUNT; i++)
            {
                config = memory[i];
                if (config.id > id)
                {
                    id = config.id;
                    pos = i;
                }
            }

            config = memory[pos];
            lastPos = pos;

            return config.Clone();
        }
    }

    class TestConfig
    {
        public byte id { get; set; }
        public int address { get; set; }

        public TestConfig Clone()
        {
            return new TestConfig
            {
                id = id,
                address = address
            };
        }

        public override string ToString()
        {
            return $"{{ id = {id} - address = {address} }}";
        }

        public override bool Equals(object obj)
        {
            var me = obj as TestConfig;
            return id == me.id
                && address == me.address;
        }
    }
}
