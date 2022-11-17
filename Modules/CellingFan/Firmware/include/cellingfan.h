#ifndef __CELLINGFAN_H__
#define __CELLINGFAN_H__

/* *** Config section ***
    To use the autohome, must define this in user_config.h

//* *** cellingfan.h config *** *
#define CELLINGFAN_LIGHT_PIN              15
#define CELLINGFAN_FAN_PIN                13
#define CELLINGFAN_FAN_DIRECTION_PIN      12
#define CELLINGFAN_FAN_SPEED_MIX_PIN      14
#define CELLINGFAN_FAN_SPEED_MAX_PIN      16
#define CELLINGFAN_LIGHT_BUTTON_PIN       xx
#define CELLINGFAN_FAN_BUTTON_PIN         02
#define CELLINGFAN_FAN_SPEED_BUTTON_PIN   02
//* *** end cellingfan.h config *** *

*/

#include "helpers/array_helpers.h"

typedef struct {
   uint8_t interruptionsOnOff : 1;
   uint8_t FW1FW2Inversion : 1;
   uint8_t FI1FI2Inversion : 1;
} cellingfan_config_pins_t;

typedef struct {
   cellingfan_config_pins_t pins;
} cellingfan_config_t;

cellingfan_config_t* cellingfan_config;

void cellingfan_init_gpios(void);
void cellingfan_init(void);
void cellingfan_msg_handler(array_builder_t* req, array_builder_t* res);

#endif