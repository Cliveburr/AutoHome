#include "osapi.h"
#include "user_config.h"
#include "spi_flash.h"

void config_save() {

    config.id++;

    spi_flash_erase_sector(CONFIG_START_SEC + 0);
    spi_flash_write((CONFIG_START_SEC + 0) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));
#ifdef DEBUG
    os_printf("config_save...\n");
    os_printf("config.id = %u\n", config.id);
#endif
    return;    

//     SpiFlashOpResult result;

//     if (config.id < 255)
//         config.id++;
//     else
//         config.id = 0;

// #ifdef DEBUG
//     os_printf("config_save...\n");
// #endif

//     do {
//         if (config.pos < CONFIG_SEC_COUNT)
//             config.pos++;
//         else
//             config.pos = 0;

//         spi_flash_erase_sector(CONFIG_START_SEC + config.pos);
//         result = spi_flash_write((CONFIG_START_SEC + config.pos) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));

// #ifdef DEBUG
//     os_printf("config.id = %u\n", config.id);
//     os_printf("config.pos = %u\n", config.pos);
// #endif

//     } while (result != SPI_FLASH_RESULT_OK);
}

void config_load() {

    config.id = 1;
    config.valid_api_address = 0;

    //spi_flash_read((CONFIG_START_SEC + 0) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));
#ifdef DEBUG
    os_printf("config_load...\n");
    os_printf("config.id = %u\n", config.id);
    os_printf("config.valid_api_address = %u\n", config.valid_api_address);
#endif
    return;

//     uint8 i = 0;
//     struct ConfigStruct readConfig;
//     SpiFlashOpResult result;

// #ifdef DEBUG
//     os_printf("config_load...\n");
// #endif

//     for (i = 0; i < CONFIG_SEC_COUNT; i++) {
        
//         result = spi_flash_read((CONFIG_START_SEC + i) * SPI_FLASH_SEC_SIZE, (uint32*)&readConfig, sizeof(struct ConfigStruct));

//         if (result == SPI_FLASH_RESULT_OK) {
//             if (readConfig.id >= config.id) {
//                 //os_memcpy(&config, &readConfig, sizeof(struct ConfigStruct));
//                 config.id = readConfig.id;
//                 config.pos = i;
//             }
//         }
//     }

// #ifdef DEBUG
//     os_printf("config.id = %u\n", config.id);
//     os_printf("config.pos = %u\n", config.pos);
// #endif

    //os_free(&readConfig);
}