#ifndef __USER_CONFIG_H__
#define __USER_CONFIG_H__

// Print messages in TX for debbuging
#define DEBUG

/* *** storage config *** */
#define CONFIG_START_SEC		0x1FC
#define CONFIG_SEC_COUNT		3

struct ConfigStruct {
    uint8 uid;
	uint16 storage_id;
    uint8 net_ssid[32];
    uint8 net_password[64];
    uint8 alias[30];
    //uint8 net_mode;
    //uint8 valid_api_address;
    //uint8 api_address[4];
} config;
/* *** end storage config *** */

/* *** auto_home config *** */
#define VERSION_HIGH       0
#define VERSION_LOW        1
#define MODULE_TYPE        2    // TempHumiSensor = 2
/* *** end auto_home config *** */

#endif