#ifndef __USER_CONFIG_H__
#define __USER_CONFIG_H__

// Print messages in TX for debbuging
#define DEBUG

/* *** storage config *** */
#define CONFIG_START_SEC		0x70

struct ConfigStruct {
    uint8 uid;
    uint8 checksum;
    uint8 net_ssid[32];
    uint8 net_password[64];
    uint8 alias[30];
    uint8 category[256];
} config;
/* *** end storage config *** */

/* *** auto_home config *** */
#define VERSION_HIGH       0
#define VERSION_LOW        1
#define MODULE_TYPE        2    // TempHumiSensor = 2
/* *** end auto_home config *** */

/* *** net config *** */
#define MOD_SEND_PORT       15555
#define MOD_RECV_PORT       15556
/* *** end net config *** */

/* *** fota config *** */
#define CHUNK_SIZE       1357     // 1460 - 1 (uid byte) - 1 (port byte) - 1 (msg byte)
#define USER1_SECTOR    0x1
#define USER2_SECTOR    0x81
/* *** end fota config *** */

#endif