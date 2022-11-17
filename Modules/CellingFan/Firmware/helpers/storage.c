#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "osapi.h"
#include "mem.h"
#include "spi_flash.h"

#include "helpers/storage.h"
#include "user_config.h"

typedef struct {
    uint32_t addr;
    uint32_t size;
} storage_data_part_t;

typedef struct {
    char* id;
    storage_data_part_t* parts;
    uint8_t parts_len;
    uint32_t total_size;
} storage_data_t;

storage_data_t* datas;
uint8_t datas_len;

ICACHE_FLASH_ATTR
void storage_init(storage_partition_t* partition_table, uint8_t partition_count, storage_info_t* storage_table, uint8_t storage_count)
{
    datas_len = storage_count;
    datas = (storage_data_t*)os_zalloc(storage_count * sizeof(storage_data_t));
    uint8_t i, partition_pos = 0;
    uint32_t addr_pos = partition_table[0].addr;
    uint32_t partition_left = partition_table[0].size;

    for (i = 0; i < datas_len; i++)
    {
        uint8_t idlen = os_strlen(storage_table[i].id) + 1;
        datas[i].id = (char*)os_zalloc(idlen * sizeof(char));
        os_memcpy(datas[i].id, storage_table[i].id, idlen);
        
        datas[i].total_size = storage_table[i].size;
        datas[i].parts = (storage_data_part_t*)os_zalloc(0);
        datas[i].parts_len = 0;
        //os_printf("storage_table[%d].size = %d\n", i, storage_table[i].size);

        uint32_t this_left = storage_table[i].size;
        while (this_left > 0)
        {
            datas[i].parts = (storage_data_part_t*)os_realloc(datas[i].parts, (datas[i].parts_len + 1) * sizeof(storage_data_part_t));
            datas[i].parts[datas[i].parts_len].addr = addr_pos;

            if (this_left <= partition_left)
            {
                datas[i].parts[datas[i].parts_len].size = this_left;

                addr_pos += this_left;

                if (addr_pos > (partition_table[partition_pos].addr + partition_table[partition_pos].size))
                {
                    partition_pos++;
                    #ifdef DEBUG
                        if (partition_pos >= partition_count)
                        {
                            os_printf("Partition small than allocation!\n");
                        }
                    #endif
                    addr_pos = partition_table[partition_pos].addr;
                    partition_left = partition_table[partition_pos].size;
                }
                else
                {
                    partition_left -= this_left;
                }

                this_left = 0;
            }
            else
            {
                datas[i].parts[datas[i].parts_len].size = partition_left;

                partition_pos++;
                #ifdef DEBUG
                    if (partition_pos >= partition_count)
                    {
                        os_printf("Partition small than allocation!\n");
                    }
                #endif
                addr_pos = partition_table[partition_pos].addr;
                this_left -= partition_left;
                partition_left = partition_table[partition_pos].size;
            }

            datas[i].parts_len++;
        }
   }
}

storage_data_t* find_data(char* id)
{
    uint8_t i;
    for (i = 0; i < datas_len; i++)
    {
        if (os_strcmp(id, datas[i].id) == 0)
        {
            return datas + i;
        }
    }
    return NULL;
}

void* storage_read(char* id)
{
    storage_data_t* data = find_data(id);
    if (data == NULL)
    {
         return NULL;
    }

    uint8_t* content = (uint8_t*)os_zalloc(data->total_size);
    uint8_t i;
    uint32_t pos = 0;
    for (i = 0; i < data->parts_len; i++)
    {
        #ifdef DEBUG
        os_printf("storage_read %d bytes on addr 0x%04X\n", data->parts[i].size, data->parts[i].addr);
        #endif        
        spi_flash_read(data->parts[i].addr, (uint32_t*)content + pos, data->parts[i].size);
        pos += data->parts[i].size;
    }

    #ifdef DEBUG
        if (pos != data->total_size)
        {
            os_printf("Reading problem!\n");
        }
    #endif

    return content;
}

void storage_write(char* id, void* content)
{
    storage_data_t* data = find_data(id);
    if (data == NULL)
    {
         return;
    }

    uint8_t i, buffer[SPI_FLASH_SEC_SIZE];
    uint32_t pos = 0;
    for (i = 0; i < data->parts_len; i++)
    {
        #ifdef DEBUG
        os_printf("storage_write %d bytes on addr 0x%04X\n", data->parts[i].size, data->parts[i].addr);
        #endif
        
        uint16_t sector = data->parts[i].addr / SPI_FLASH_SEC_SIZE;
        uint32_t sector_init = sector * SPI_FLASH_SEC_SIZE;
        uint32_t relactive_pos = data->parts[i].addr - sector_init;
        //os_printf("write sector: 0x%04X, init: 0x%04X, rela: 0x%04X\n", sector, sector_init, relactive_pos);
        spi_flash_read(sector_init, (uint32_t*)buffer, SPI_FLASH_SEC_SIZE);
        os_memcpy(buffer + relactive_pos, (uint32_t*)content + pos, data->parts[i].size);

        spi_flash_erase_sector(sector);
        spi_flash_write(sector_init, (uint32_t*)buffer, SPI_FLASH_SEC_SIZE);
        pos += data->parts[i].size;
    }

    #ifdef DEBUG
    if (pos != data->total_size)
    {
        os_printf("Reading problem!\n");
    }
    #endif
}

// #include "osapi.h"
// #include "spi_flash.h"
// #include "limits.h"
// #include "mem.h"

// #include "storage.h"
// #include "user_config.h"

// //uint8_t lastPos;

// ICACHE_FLASH_ATTR
// void storage_save(void)
// {
//     //SpiFlashOpResult result;
//     //uint8 i;
//     //uint8 tries = 0;

//     #ifdef DEBUG
//         os_printf("storage_save...\n");
//     #endif

//     config.checksum = config.uid ^ 0xAA;
//     os_printf("checksum = %u\n", config.checksum);

//     spi_flash_erase_sector(CONFIG_START_SEC);
//     spi_flash_write(CONFIG_START_SEC * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));

//     // if (config.storage_id >= USHRT_MAX)
//     // {
//     //     config.storage_id = 0;

//     //     for (i = 0; i < CONFIG_SEC_COUNT; i++)
//     //     {
//     //         #ifdef DEBUG
//     //             os_printf("save refresh config.storage_id = 0 into pos %u\n", i);
//     //         #endif
//     //         spi_flash_erase_sector(CONFIG_START_SEC + i);
//     //         spi_flash_write((CONFIG_START_SEC + i) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));
//     //     }
//     // }
//     // else
//     // {
//     //     config.storage_id++;

//     //     do
//     //     {
//     //         if (lastPos < CONFIG_SEC_COUNT - 1)
//     //             lastPos++;
//     //         else
//     //             lastPos = 0;

//     //         #ifdef DEBUG
//     //             os_printf("save config.storage_id = %d into pos %u\n", config.storage_id, lastPos);
//     //         #endif
//     //         spi_flash_erase_sector(CONFIG_START_SEC + lastPos);
//     //         spi_flash_write((CONFIG_START_SEC + lastPos) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));

//     //         tries++;

//     //     } while (result != SPI_FLASH_RESULT_OK && tries < CONFIG_SEC_COUNT - 1);
//     // }
// }

// ICACHE_FLASH_ATTR
// void storage_load(void)
// {
//     //uint8 i;
//     //struct ConfigStruct *readConfig;
//     //uint8 id = 0;
//     //int8 pos = -1;

//     #ifdef DEBUG
//         os_printf("storage_load...\n");
//     #endif

//     spi_flash_read(CONFIG_START_SEC * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));

//     uint8 checksum = config.uid ^ 0xAA;
//     #ifdef DEBUG
//         os_printf("checksum = %u, config.checksum = %u\n", checksum, config.checksum);
//     #endif

//     if (config.checksum != checksum)
//     {
//         config.uid = 0;
//         config.checksum = 0;
//     }

//     // for (i = 0; i < CONFIG_SEC_COUNT; i++)
//     // {
//     //     spi_flash_read((CONFIG_START_SEC + i) * SPI_FLASH_SEC_SIZE, (uint32*)&readConfig, sizeof(struct ConfigStruct));

//     //     uint8 checksum = readConfig.uid ^ readConfig.storage_id;
//     //     os_printf("load checksum %u\n", config.checksum);

//     //     if (readConfig.checksum == checksum && readConfig.storage_id > id) {
//     //         id = readConfig.storage_id;
//     //         pos = i;
//     //     }
//     // }

//     // if (pos > -1)
//     // {
//     //     spi_flash_read((CONFIG_START_SEC + pos) * SPI_FLASH_SEC_SIZE, (uint32*)&config, sizeof(struct ConfigStruct));
//     //     lastPos = pos;

//     //     #ifdef DEBUG
//     //         os_printf("load config.storage_id = %u into pos %u\n", config.storage_id, pos);
//     //     #endif
//     // }
//     // else
//     // {
//     //     lastPos = 0;
//     //     #ifdef DEBUG
//     //         os_printf("no valid storage slot!\n");
//     //     #endif
//     //     config.uid = 0;
//     //     config.checksum = 0;
//     // }

//     // os_free(&readConfig);
// }