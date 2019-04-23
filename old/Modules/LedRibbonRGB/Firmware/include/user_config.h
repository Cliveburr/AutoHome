#ifndef __USER_CONFIG_H__
#define __USER_CONFIG_H__

#include "ets_sys.h"

// Print messages in TX for debbuging
#define DEBUG

// Config defines
#define CONFIG_START_SEC		0x3C         // 512kb = 0x3C
#define CONFIG_SEC_COUNT		3


#define SEND_PORT        15555
#define RECEIVE_PORT     15556


struct ConfigStruct {
    uint64 id;
    //uint8 pos;
    uint8 net_mode;
    uint8 net_ssid[32];
    uint8 net_password[64];
    uint8 valid_api_address;
    uint8 api_address[4];
} config;

// RGB Ribbon settings
#define REDPIN 12
#define REDFUNC FUNC_GPIO12
#define BLUEPIN 4
#define BLUEFUNC FUNC_GPIO4
#define GREENPIN 5
#define GREENFUNC FUNC_GPIO5

#endif