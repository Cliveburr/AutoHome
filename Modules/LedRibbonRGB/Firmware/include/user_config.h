#ifndef __USER_CONFIG_H__
#define __USER_CONFIG_H__

// Print messages in TX for debbuging
#define DEBUG

// The UID of this AutoHome Module *** MUST BE UNIQUE ***
#define MyUID 3;

// Config defines
#define CONFIG_START_SEC		0x3C
#define CONFIG_SEC_COUNT		3

struct ConfigStruct {
    uint32 id;
    uint8 pos;
    uint8 net_mode;
    uint8 net_ssid[32];
    uint8 net_password[64];
} config;

// RGB Ribbon settings
#define REDPIN 12;
#define REDFUNC = FUNC_GPIO12;
#define BLUEPIN 4;
#define BLUEFUNC = FUNC_GPIO4;
#define GREENPIN 5;
#define GREENFUNC = FUNC_GPIO5;

#endif