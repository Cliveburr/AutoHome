#include "osapi.h"
#include "spi_flash.h"
#include "limits.h"
#include "mem.h"
#include "storage.h"
#include "user_config.h"

ICACHE_FLASH_ATTR
void storage_save(void)
{
    SpiFlashOpResult result;
    uint8 i;
    uint8 tries = 0;

    #ifdef DEBUG
        os_printf("void storage_save(void)\n");
    #endif

    if (config.storage_id >= USHRT_MAX) {
        config.storage_id = 0;

        for (i = 0; i < CONFIG_SEC_COUNT; i++) {
            #ifdef DEBUG
                os_printf("save refresh config.storage_id = 0 into pos %u\n", i);
            #endif
            spi_flash_erase_sector(CONFIG_START_SEC + i);
            spi_flash_write((CONFIG_START_SEC + i) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));
        }
    }
    else {
        config.storage_id++;

        uint8 pos = lastPos;
        do {
            if (pos < CONFIG_SEC_COUNT - 1)
                pos++;
            else
                pos = 0;

            #ifdef DEBUG
                os_printf("save config.storage_id = %d into pos %u\n", config.id, pos);
            #endif
            spi_flash_erase_sector(CONFIG_START_SEC + pos);
            spi_flash_write((CONFIG_START_SEC + pos) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));

            tries++;

        } while (result != SPI_FLASH_RESULT_OK && tries < CONFIG_SEC_COUNT - 1);
    }
}

ICACHE_FLASH_ATTR
void storage_load(void)
{
    SpiFlashOpResult result;
    uint8 i;
    struct ConfigStruct readConfig;
    uint8 pos = 0;
    uint8 id = 0;

    #ifdef DEBUG
        os_printf("storage_load...\n");
    #endif

    for (i = 0; i < CONFIG_SEC_COUNT; i++) {
        spi_flash_read((CONFIG_START_SEC + i) * SPI_FLASH_SEC_SIZE, (uint32*)&readConfig, sizeof(struct ConfigStruct));

        if (readConfig.storage_id > id) {
            id = readConfig.storage_id;
            pos = i;
        }
    }

    #ifdef DEBUG
        os_printf("load config.storage_id = %u into pos %u\n", id, pos);
    #endif
    spi_flash_read((CONFIG_START_SEC + pos) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));
    lastPos = pos;

    os_free(&readConfig);
}