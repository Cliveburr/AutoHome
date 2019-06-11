using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public partial class TempHumiSensorPort
    {
		/* Configs */
        private const ushort TEMPHUMI_DATAINFO_SECTOR = 0x72;
        /* Configs */

		// datainfo size 16 bytes
        public ulong datainfo_id;  // 8 bytes
        public uint datainfo_addr;  // 4 bytes
        public uint datainfo_checksum;  // 4 bytes
        public ushort datainfo_pos;

        public void temphumisensor_datainfo_load()
        {
            var infoSector = new byte[SPI_FLASH_SEC_SIZE];
            uint sectorIniAddr = TEMPHUMI_DATAINFO_SECTOR * SPI_FLASH_SEC_SIZE;

            spi_flash_read(sectorIniAddr, ref infoSector, SPI_FLASH_SEC_SIZE);

            datainfo_id = 0;
            datainfo_addr = 0;
            datainfo_checksum = 0;
            datainfo_pos = 0;
            for (var i = 0; i < SPI_FLASH_SEC_SIZE; i += 16)
            {
                var thisId = BitConverter.ToUInt64(infoSector, i);
				var thisAddr = BitConverter.ToUInt32(infoSector, i + 8);
                var thisChecksum = BitConverter.ToUInt32(infoSector, i + 12);

                var calculedChecksum = thisId + thisAddr;

                if (calculedChecksum == thisChecksum)
                {
                    if (thisId > datainfo_id)
                    {
                        datainfo_id = thisId;
                        datainfo_addr = thisAddr;
                        datainfo_checksum = thisChecksum; // only to Tests project
                        datainfo_pos = (ushort)i;
                    }
                }
            }
        }

        public void temphumisensor_datainfo_save(uint addr)
        {
            datainfo_id++;
            datainfo_pos += 16;
            if (datainfo_id == 0)
            {
                spi_flash_erase_sector(TEMPHUMI_DATAINFO_SECTOR);
                datainfo_pos = 0;
            }

            if ((datainfo_pos + 16) >= SPI_FLASH_SEC_SIZE)
            {
                datainfo_pos = 0;
            }

            datainfo_addr = addr;
            datainfo_checksum = (uint)datainfo_id + datainfo_addr;

            var buffer = BitConverter.GetBytes(datainfo_id)
                .Concat(BitConverter.GetBytes(datainfo_addr))
                .Concat(BitConverter.GetBytes(datainfo_checksum))
                .ToArray();

            uint sectorIniAddr = TEMPHUMI_DATAINFO_SECTOR * SPI_FLASH_SEC_SIZE;

            spi_flash_write(sectorIniAddr + datainfo_pos, buffer, 16);
        }

        /* Configs */
        private const uint TEMPHUMISENSOR_DATA_SECTOR_INI = 0xEB;
        private const uint TEMPHUMISENSOR_DATA_SECTOR_END = 0x400;
        /* Configs */

        private const int TEMPHUMISENSOR_DATA_PACKAGE_COUNTS = 50;
        private const int TEMPHUMISENSOR_DATA_PACKAGE_LEN = 256;
        private const uint TEMPHUMISENSOR_DATA_SECTOR_INI_ADDR = TEMPHUMISENSOR_DATA_SECTOR_INI * SPI_FLASH_SEC_SIZE;
        private const uint TEMPHUMISENSOR_DATA_SECTOR_END_ADDR = TEMPHUMISENSOR_DATA_SECTOR_END * SPI_FLASH_SEC_SIZE;

        // data_package_t size 256 bytes
        public struct data_package_t
        {
			public uint started_timestamp { get; set; }  // 4 bytes
			public ushort readInterval { get; set; }  // 2 bytes
            public byte[] data { get; set; } // 5 * 50 = 250 bytes   (5 bytes for each sequence of total 50)
        }

        public bool hasPackageInitied;
        public data_package_t data_package;
        private byte data_package_pos;

        private void temphumisensor_createdatapackage()
        {
            hasPackageInitied = true;
            data_package_pos = 0;

            data_package = new data_package_t();
            data_package.started_timestamp = (uint)DateTimeOffset.Now.ToUnixTimeSeconds();
            data_package.readInterval = temphumisensor_config.readInterval;
            data_package.data = new byte[5 * TEMPHUMISENSOR_DATA_PACKAGE_COUNTS];
        }

        private void temphumisensor_writedatapackage()
        {
            var addr = datainfo_addr == 0 ?
                TEMPHUMISENSOR_DATA_SECTOR_INI_ADDR :
                datainfo_addr + TEMPHUMISENSOR_DATA_PACKAGE_LEN;

            if ((addr + TEMPHUMISENSOR_DATA_PACKAGE_LEN) >= (TEMPHUMISENSOR_DATA_SECTOR_END_ADDR))
			{
                addr = TEMPHUMISENSOR_DATA_SECTOR_INI_ADDR;
            }

            var buffer = BitConverter.GetBytes(data_package.started_timestamp)
                .Concat(BitConverter.GetBytes(data_package.readInterval))
                .Concat(data_package.data)
                .ToArray();

            spi_flash_write(addr, buffer, TEMPHUMISENSOR_DATA_PACKAGE_LEN);
            // release data_package.data

            temphumisensor_datainfo_save(addr);

            hasPackageInitied = false;
        }

        public void temphumisensor_data_save()
        {
            // messages
            // ler os dados do sector de next_free_slot
            // solicitar pacotes, passar o primeiro sector e a quantidade a ler

            // na função temphumisensor_resetall, se tiver pacote aberto, salvar e não abrir outro
            // na função temphumisensor_set_timers tem q tratar se fecha o pacote aberto

            if (!hasPackageInitied)
            {
                temphumisensor_createdatapackage();
            }

            var datapck_addr = data_package_pos * 5;
            Array.Copy(moduleOne.data, 0, data_package.data, datapck_addr, 4);
            data_package.data[datapck_addr + 4] = swtichStates.Value;

            data_package_pos++;

            if (data_package_pos == TEMPHUMISENSOR_DATA_PACKAGE_COUNTS)
            {
                temphumisensor_writedatapackage();
            }
        }
    }
}