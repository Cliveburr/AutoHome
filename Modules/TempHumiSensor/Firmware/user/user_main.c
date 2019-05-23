#define USE_US_TIMER

#include "osapi.h"
#include "user_interface.h"

#include "user_config.h"
#include "autohome.h"
#include "net.h"
#include "temphumisensor.h"

static const partition_item_t at_partition_table[] = {
    { SYSTEM_PARTITION_BOOTLOADER, 						0x0, 												0x1000},
    { SYSTEM_PARTITION_OTA_1,   						0x1000, 											0x6A000},
    { SYSTEM_PARTITION_OTA_2,   						0x81000,                     						0x6A000},
    { SYSTEM_PARTITION_RF_CAL,  						0x6B000,                     						0x1000},
    { SYSTEM_PARTITION_PHY_DATA, 						0x6C000,                         					0x1000},
    { SYSTEM_PARTITION_SYSTEM_PARAMETER, 				0x6D000,                                 			0x3000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 0,              0x70000,                                            0x1000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 1,              0x71000,                                            0x1000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 2,              0xEB000,                                            0x315000}
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
		os_printf("Module Temperature and Humidity Sensor OAT3\n");
        os_printf("SDK version: %s\n", system_get_sdk_version());
        //os_printf("Auto Home SA %u.%u - Module UID: %u\n", VERSION_HIGH, VERSION_LOW, MYUID);
    #endif

	system_init_done_cb(init_done);
}

ICACHE_FLASH_ATTR
void init_pins(void)
{
    #ifdef DEBUG
        os_printf("init_pins...\n");
    #endif

    // GPIO 14 - Sensor Pin
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTMS_U, FUNC_GPIO14);
    GPIO_DIS_OUTPUT(GPIO_ID_PIN(14));

    // GPIO 4 - Temperature Switch
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO4);

    // GPIO 5 - Humidity Switch
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO5);

    // GPIO 13 - Wifi Mode
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTCK_U, FUNC_GPIO13);
    PIN_PULLUP_EN(PERIPHS_IO_MUX_MTCK_U);

    // GPIO 12 - Switch Signal
    // PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO12);
}

ICACHE_FLASH_ATTR
void set_net(void)
{
    uint8 start_mode = GPIO_INPUT_GET(13);

    if (start_mode) {
        net_start_station();
    }
    else {
        net_start_accesspoint();
    }
}

ICACHE_FLASH_ATTR
void init_done(void)
{
    init_pins();

	autohome_init();

    temphumisensor_init();

    set_net();
}
