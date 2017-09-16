#ifndef __USER_CONFIG_H__
#define __USER_CONFIG_H__

#include "ets_sys.h"

// Print messages in TX for debbuging
#define DEBUG


/* *** flash_funcs config *** */
#define CONFIG_START_SEC		0x1FC
#define CONFIG_SEC_COUNT		3

struct ConfigStruct {
    uint16 id;
    uint8 net_ssid[32];
    uint8 net_password[64];
    uint8 alias[30];
    //uint8 net_mode;
    //uint8 valid_api_address;
    //uint8 api_address[4];
} config;
/* *** end flash_funcs config *** */


/* *** net config *** */
#define MOD_SEND_PORT       15555
#define MOD_RECV_PORT       15556
/* *** end net config *** */


/* *** auto_home config *** */
#define MYUID              1
#define VERSION_HIGH       0
#define VERSION_LOW        1
#define MODULE_TYPE        1    // LedRibbonRgb = 1
/* *** end auto_home config *** */


/* *** fota config *** */
#define CHUNK_SIZE       1358
#define USER1_SECTOR    0x001
#define USER2_SECTOR    0x101
/* *** end fota config *** */

// RGB Ribbon settings
// #define REDPIN 12
// #define REDFUNC FUNC_GPIO12
// #define BLUEPIN 4
// #define BLUEFUNC FUNC_GPIO4
// #define GREENPIN 5
// #define GREENFUNC FUNC_GPIO5

#endif