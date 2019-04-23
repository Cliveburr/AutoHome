#include "osapi.h"
#include "ets_sys.h"
#include "user_interface.h"
#include "user_config.h"
#include "flash_funcs.h"
#include "net.h"
#include "led_ribbon.h"

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

ICACHE_FLASH_ATTR
void set_start_mode(void) {

    unsigned char start_mode = GPIO_INPUT_GET(13);

    if (start_mode) {
        set_station_mode();
    }
    else {
        set_accesspoint_mode();
    }
}

ICACHE_FLASH_ATTR
void ledRibbon_setAndInitialize(void) {
    #ifdef DEBUG
        os_printf("ledRibbon_setAndInitialize...\n");
    #endif

    // GPIO 14 - Red Signal
    redPin.pin = 14;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTMS_U, FUNC_GPIO14);

    // GPIO 4 - Blue Signal
    bluePin.pin = 4;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO4);

    // GPIO 5 - Green Signal
    greenPin.pin = 5;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO5);

    // GPIO 13 - Wifi Mode
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTCK_U, FUNC_GPIO13);
    PIN_PULLUP_EN(PERIPHS_IO_MUX_MTCK_U);

    // GPIO 12 - Switch Signal
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO12);

    ledRibbon_initialize();
}


void user_init(void) {
    system_timer_reinit();

    #ifdef DEBUG
        os_printf("SDK version: %s\n", system_get_sdk_version());
        os_printf("Auto Home SA %u.%u - Module UID: %u\n", VERSION_HIGH, VERSION_LOW, MYUID);
        os_printf("Module type RGB Led Ribbon\n");
    #endif

    config_load();

    ledRibbon_setAndInitialize();

    set_start_mode();
}