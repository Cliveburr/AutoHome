#ifndef __USER_CONFIG_H__
#define __USER_CONFIG_H__

// Print messages in TX for debbuging
#define DEBUG

/* *** auto_home config *** */
#define FIRMWARE_VERSION   1
#define MODULE_TYPE        5    // CellingFan = 5
/* *** end auto_home config *** */

/* *** net config *** */
#define MOD_SEND_PORT       15863
#define MOD_RECV_PORT       15862
/* *** end net config *** */

/* *** fota config *** */
#define CHUNK_SIZE      1456   // 1460 - 4 = 1456 - 1 (form uid byte) - 1 (to uid byte) - 1 (port byte) - 1 (msg byte)
#define USER1_SECTOR    0x1
#define USER2_SECTOR    0x81
/* *** end fota config *** */

/* *** cellingfan.h config *** */
#define CELLINGFAN_LIGHT_PIN              16
#define CELLINGFAN_FAN_PIN                15
#define CELLINGFAN_FAN_DIRECTION_PIN      02
#define CELLINGFAN_FAN_SPEED_MIX_PIN      04
#define CELLINGFAN_FAN_SPEED_MAX_PIN      05
#define CELLINGFAN_LIGHT_BUTTON_PIN       13
#define CELLINGFAN_FAN_BUTTON_PIN         12
#define CELLINGFAN_FAN_SPEED_BUTTON_PIN   14
/* *** end cellingfan.h config *** */

#endif