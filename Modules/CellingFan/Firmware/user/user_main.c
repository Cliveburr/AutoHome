#define USE_US_TIMER

#include "osapi.h"
#include "user_interface.h"

#include "user_config.h"
#include "autohome.h"
#include "net.h"
#include "helpers/storage.h"

static const partition_item_t at_partition_table[] = {
    { SYSTEM_PARTITION_BOOTLOADER, 						0x0, 					0x1000},
    { SYSTEM_PARTITION_OTA_1,   						0x1000, 				0x6A000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 0,              0x6B000,                0x16000},
    { SYSTEM_PARTITION_OTA_2,   						0x81000,                0x6A000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 1,              0xEB000,                0x310000},
    { SYSTEM_PARTITION_RF_CAL,  						0x3FB000,            	0x1000},
    { SYSTEM_PARTITION_PHY_DATA, 						0x3FC000,            	0x1000},
    { SYSTEM_PARTITION_SYSTEM_PARAMETER, 				0x3FD000,            	0x3000}
};


void init_done(void);

ICACHE_FLASH_ATTR
void user_pre_init(void)
{
    if(!system_partition_table_regist(at_partition_table, sizeof(at_partition_table)/sizeof(at_partition_table[0]), 4)) {   //SPI_FLASH_SIZE_MAP
		os_printf("system_partition_table_regist fail\r\n");
		while(1);
	}
}

ICACHE_FLASH_ATTR
void user_init(void)
{
	system_timer_reinit();

    #ifdef DEBUG
		os_printf("Module Celling Fan\n");
        os_printf("SDK version: %s\n", system_get_sdk_version());
    #endif

    cellingfan_init_gpios();

	system_init_done_cb(init_done);
}

ICACHE_FLASH_ATTR
void init_done(void)
{
    storage_partition_t storage_partition_table[] = {
        { 0x6B000, 0x16000 },
        { 0xEB000, 0x310000 }
    };
    storage_info_t storage_info_table[] = {
        { "autohome", sizeof(autohome_configuration_t) }
    };
    storage_init(storage_partition_table, 2, storage_info_table, 1);

	autohome_init();

    cellingfan_init();

    net_init();
}
