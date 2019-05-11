#ifndef __STORAGE_H__
#define __STORAGE_H__

/* *** Config section ***
    To use the config save and load, must define this in user_config.h

/* *** storage.h config *** *
#define CONFIG_START_SEC		0x3C         // 512kb = 0x3C      1024kb = 0x1FC
#define CONFIG_SEC_COUNT		3

typedef struct StorageStruct {
    uint8 id;
    uint8 pos;
} config;
/* *** end storage.h config *** *

*/

void storage_load(void);
void storage_save(void);

#endif