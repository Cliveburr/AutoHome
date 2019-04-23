#include "user_config.h"
#include "autohome.h"
#include "storage.h"
#include "temphumisensor.h"

#define USE_US_TIMER

ICACHE_FLASH_ATTR
void user_init(void)
{
    system_timer_reinit();

    #ifdef DEBUG
        os_printf("Module Temperature and Humidity Sensor\n");
    #endif

    storage_load();

    temphumisensor_init();
}