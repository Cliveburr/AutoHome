#ifndef __FLASH_FUNCS_H__
#define __FLASH_FUNCS_H__

#include "user_config.h"

/* *** Config section *** */

/* To use the config save and load, must define this in user_config.h

#define CONFIG_START_SEC		0x3C         // 512kb = 0x3C
#define CONFIG_SEC_COUNT		3

struct ConfigStruct {
    uint8 id;
    uint8 pos;
};

*/

void config_save();
void config_load();

/* *** End Config section *** */


#endif