#ifndef __USER_CONFIG_H__
#define __USER_CONFIG_H__

// Print messages in TX for debbuging
#define DEBUG

/* *** storage config *** */
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
/* *** end storage config *** */

#endif