#include "osapi.h"
#include "spi_flash.h"
#include "limits.h"
#include "mem.h"
#include "storage.h"
#include "user_config.h"

uint8_t lastPos;

ICACHE_FLASH_ATTR
void storage_save(void)
{
    SpiFlashOpResult result;
    uint8 i;
    uint8 tries = 0;

    #ifdef DEBUG
        os_printf("void storage_save(void)\n");
    #endif

    config.checksum = config.uid ^ config.storage_id;
    os_printf("save checksum %u\n", config.checksum);

    if (config.storage_id >= USHRT_MAX)
    {
        config.storage_id = 0;

        for (i = 0; i < CONFIG_SEC_COUNT; i++)
        {
            #ifdef DEBUG
                os_printf("save refresh config.storage_id = 0 into pos %u\n", i);
            #endif
            spi_flash_erase_sector(CONFIG_START_SEC + i);
            spi_flash_write((CONFIG_START_SEC + i) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));
        }
    }
    else
    {
        config.storage_id++;

        do
        {
            if (lastPos < CONFIG_SEC_COUNT - 1)
                lastPos++;
            else
                lastPos = 0;

            #ifdef DEBUG
                os_printf("save config.storage_id = %d into pos %u\n", config.storage_id, lastPos);
            #endif
            spi_flash_erase_sector(CONFIG_START_SEC + lastPos);
            spi_flash_write((CONFIG_START_SEC + lastPos) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));

            tries++;

        } while (result != SPI_FLASH_RESULT_OK && tries < CONFIG_SEC_COUNT - 1);
    }
}

ICACHE_FLASH_ATTR
void storage_load(void)
{
    uint8 i;
    struct ConfigStruct readConfig;
    uint8 id = 0;
    int8 pos = -1;

    #ifdef DEBUG
        os_printf("storage_load...\n");
    #endif

    for (i = 0; i < CONFIG_SEC_COUNT; i++)
    {
        spi_flash_read((CONFIG_START_SEC + i) * SPI_FLASH_SEC_SIZE, (uint32*)&readConfig, sizeof(struct ConfigStruct));

        uint8 checksum = readConfig.uid ^ readConfig.storage_id;
        os_printf("load checksum %u\n", config.checksum);

        if (readConfig.checksum == checksum && readConfig.storage_id > id) {
            id = readConfig.storage_id;
            pos = i;
        }
    }

    if (pos > -1)
    {
        spi_flash_read((CONFIG_START_SEC + pos) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));
        lastPos = pos;

        #ifdef DEBUG
            os_printf("load config.storage_id = %u into pos %u\n", config.storage_id, pos);
        #endif
    }
    else
    {
        lastPos = 0;
        #ifdef DEBUG
            os_printf("no valid storage slot!\n");
        #endif
        config.uid = 0;
        config.checksum = 0;
    }

    os_free(&readConfig);
}