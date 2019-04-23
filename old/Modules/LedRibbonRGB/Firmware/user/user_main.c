#include "osapi.h"
#include "ets_sys.h"
#include "user_interface.h"
#include "user_config.h"
#include "flash_funcs.h"
#include "auto_home.station.h"

#define USE_US_TIMER

uint32 ICACHE_FLASH_ATTR
user_rf_cal_sector_set(void) {
    enum flash_size_map size_map = system_get_flash_size_map();
    uint32 rf_cal_sec = 0;

    switch (size_map) {
        case FLASH_SIZE_4M_MAP_256_256:
            rf_cal_sec = 128 - 5;
            break;

        case FLASH_SIZE_8M_MAP_512_512:
            rf_cal_sec = 256 - 5;
            break;

        case FLASH_SIZE_16M_MAP_512_512:
        case FLASH_SIZE_16M_MAP_1024_1024:
            rf_cal_sec = 512 - 5;
            break;

        case FLASH_SIZE_32M_MAP_512_512:
        case FLASH_SIZE_32M_MAP_1024_1024:
            rf_cal_sec = 1024 - 5;
            break;

        default:
            rf_cal_sec = 0;
            break;
    }

    return rf_cal_sec;
}

void set_mode(void) {

    set_station_mode();
}

void user_init(void) {
    system_timer_reinit();

    MyUID = 3;

#ifdef DEBUG
    os_printf("SDK version: %s\n", system_get_sdk_version());
    os_printf("Auto Home - Module UID: %u\n", MyUID);
    os_printf("Module type RGB Led Ribbon\n");
#endif

    config_load();

    ledRibbon_initialize();

    set_mode();
}