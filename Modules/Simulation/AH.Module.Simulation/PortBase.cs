using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public class PortBase
    {
        public const ushort SPI_FLASH_SEC_SIZE = 4096;

        private byte[] _memory;

        private void CheckMemory()
        {
            if (_memory == null)
            {
                _memory = new byte[4 * 1024 * 1204];
            }
        }

        public void spi_flash_erase_sector(ushort sector)
        {
            CheckMemory();
            var newSector = new byte[SPI_FLASH_SEC_SIZE];
            Array.Copy(newSector, 0, _memory, sector * SPI_FLASH_SEC_SIZE, SPI_FLASH_SEC_SIZE);
        }
        public void spi_flash_write(uint pos, byte[] buffer, uint len)
        {
            CheckMemory();
            Array.Copy(buffer, 0, _memory, pos, len);
        }

        public void spi_flash_read(uint pos, ref byte[] buffer, uint len)
        {
            CheckMemory();
            Array.Copy(_memory, pos, buffer, 0, len);
        }
    }
}