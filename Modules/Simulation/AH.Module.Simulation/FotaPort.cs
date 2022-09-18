using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AH.Protocol.Library;
using AH.Protocol.Library.Messages.Fota;

namespace AH.Module.Simulation
{
    public class FotaPort
    {
        private static FotaPort _instance;
        public static FotaPort Instance { get; } = _instance ?? new FotaPort();

        public byte UserBin { get; set; }

        private const ushort CHUNK_SIZE = 1456;
        private const int SPI_FLASH_SEC_SIZE = 4096;
        private uint upgrade_length;          // total de bytes a ser gravado 
        private byte[] upgrade_buffer;        // buffer para gravar
        private uint upgrade_buffer_length;   // quantidade de bytes gravado no buffer
        private ushort upgrade_sector;
        private byte[] file_content;

        private FotaPort()
        {
            UserBin = 0;
        }

        public IContentMessage OnReceived(Message message)
        {
            switch (message.Msg)
            {
                case (byte)FotaMessageType.StateReadRequest: return HandleStateRead(message);
                case (byte)FotaMessageType.StartRequest: return HandleStart(message);
                case (byte)FotaMessageType.WriteRequest: return HandleWrite(message);
                default: return null;
            }
        }

        private IContentMessage HandleStateRead(Message message)
        {
            Program.Log("Fota - HandleStateRead");

            return new StateReadResponse
            {
                UserBin = UserBin,
                ChunkSize = CHUNK_SIZE
            };
        }

        private IContentMessage HandleStart(Message message)
        {
            Program.Log("Fota - HandleStart");

            var content = message.ReadContent<StartRequest>();

            upgrade_buffer = new byte[SPI_FLASH_SEC_SIZE];
            upgrade_buffer_length = 0;

            upgrade_length = content.FileSize;
            upgrade_sector = 0;

            file_content = new byte[upgrade_length];

            return null;
        }

        private IContentMessage HandleWrite(Message message)
        {
            Program.Log("Fota - HandleWrite");

            FotaWriteRequest.ChunkSize = CHUNK_SIZE;
            var content = message.ReadContent<FotaWriteRequest>();
            var data = content.Chunk;

            uint length = upgrade_length >= CHUNK_SIZE ?
                CHUNK_SIZE :
                upgrade_length;

            uint tlength = 0;
            uint left = 0;

            if (upgrade_buffer_length + length > SPI_FLASH_SEC_SIZE)
            {
                tlength = SPI_FLASH_SEC_SIZE - upgrade_buffer_length;
                left = length - tlength;

                //os_memcpy(upgrade_buffer + upgrade_buffer_length, data, tlength);
                Array.Copy(data, 0, upgrade_buffer, upgrade_buffer_length, tlength);
                upgrade_buffer_length += tlength;
            }
            else
            {
                //os_memcpy(upgrade_buffer + upgrade_buffer_length, data, length);
                Array.Copy(data, 0, upgrade_buffer, upgrade_buffer_length, length);
                upgrade_buffer_length += length;
            }

            if (upgrade_buffer_length == SPI_FLASH_SEC_SIZE)
            {
                Console.WriteLine(string.Format("fotaWrite sector: {0} bytes for {1} sector", upgrade_buffer_length, upgrade_sector));

                //spi_flash_erase_sector(upgrade_sector);
                //spi_flash_write(upgrade_sector * SPI_FLASH_SEC_SIZE, (uint32*)upgrade_buffer, SPI_FLASH_SEC_SIZE);
                Array.Copy(upgrade_buffer, 0, file_content, upgrade_sector * SPI_FLASH_SEC_SIZE, SPI_FLASH_SEC_SIZE);

                upgrade_sector++;
                //os_memset(upgrade_buffer, 0, SPI_FLASH_SEC_SIZE);
                upgrade_buffer = new byte[SPI_FLASH_SEC_SIZE];
                upgrade_buffer_length = 0;
            }

            if (left > 0)
            {
                //os_memcpy(upgrade_buffer, data + tlength, left);
                Array.Copy(data, tlength, upgrade_buffer, 0, left);
                upgrade_buffer_length += left;
            }

            upgrade_length -= length;
            //unsigned char* responseBuffer = (unsigned char*)os_zalloc(3);
            //responseBuffer[0] = MYUID;
            //responseBuffer[1] = MT_FotaWriteResponse;

            if (upgrade_length == 0)
            {
                if (upgrade_buffer_length > 0)
                {
                    //spi_flash_erase_sector(upgrade_sector);
                    //spi_flash_write(upgrade_sector * SPI_FLASH_SEC_SIZE, (uint32*)upgrade_buffer, SPI_FLASH_SEC_SIZE);
                    Array.Copy(upgrade_buffer, 0, file_content, upgrade_sector * SPI_FLASH_SEC_SIZE, upgrade_buffer_length);
                }

                WriteFile();

                UserBin = UserBin == 1 ? (byte)2 : (byte)1;

                return new FotaWriteResponse
                {
                    IsOver = true
                };
            }
            else
            {
                return new FotaWriteResponse
                {
                    IsOver = false
                };
            }
        }

        private void WriteFile()
        {
            var fileName = $"FotaUser{UserBin}_{DateTime.Now.ToString("HHMM_ddMMyyyy")}.bin";
            var fotaFolderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "FotaBin");

            if (!Directory.Exists(fotaFolderPath))
            {
                Directory.CreateDirectory(fotaFolderPath);
            }

            var filePath = Path.Combine(fotaFolderPath, fileName);
            File.WriteAllBytes(filePath, file_content);
        }
    }
}