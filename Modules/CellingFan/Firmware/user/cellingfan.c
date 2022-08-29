#include "osapi.h"

#include "gpio.h"

#include "helpers/gpios.h"
#include "cellingfan.h"

/*
	Messages id
	1 = state_read request
	2 = state_read response
	3 = state_save request
	4 = state_save response
*/

typedef enum {
    cellingfan_state_fanSpeed_min = 0,
    cellingfan_state_fanSpeed_medium = 1,
    cellingfan_state_fanSpeed_max = 2,
    cellingfan_state_fanSpeed_notset = 3
} cellingfan_state_fanSpeed_t;

typedef struct {
   uint8_t light : 1;
   uint8_t fan : 1;
   uint8_t fanUp : 1;
   uint8_t fanSpeed : 2;
} cellingfan_state_t;

LOCAL cellingfan_state_t cellingfan_state;

LOCAL ICACHE_FLASH_ATTR
void cellingfan_state_read(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("cellingfan_state_read...\n");
	#endif

	array_write_uchar(res, 2); // state_read response

    array_write_uchar(res, *(uint8_t*)&cellingfan_state);
}

typedef struct {
   uint8_t setlight : 1;
   uint8_t light : 1;
   uint8_t setfan : 1;
   uint8_t fan : 1;
   uint8_t setfanUp : 1;
   uint8_t fanUp : 1;
   uint8_t fanSpeed : 2;
} cellingfan_state_save_t;

LOCAL ICACHE_FLASH_ATTR
void cellingfan_set_fanspeed_state(void)
{
    switch (cellingfan_state.fanSpeed)
    {
        case cellingfan_state_fanSpeed_min:
            gpios_set_output_low(CELLINGFAN_FAN_SPEED_MIX_PIN);
            gpios_set_output_low(CELLINGFAN_FAN_SPEED_MAX_PIN);
            break;
        case cellingfan_state_fanSpeed_medium:
            gpios_set_output_high(CELLINGFAN_FAN_SPEED_MIX_PIN);
            gpios_set_output_low(CELLINGFAN_FAN_SPEED_MAX_PIN);
            break;
        case cellingfan_state_fanSpeed_max:
            gpios_set_output_high(CELLINGFAN_FAN_SPEED_MIX_PIN);
            gpios_set_output_high(CELLINGFAN_FAN_SPEED_MAX_PIN);
            break;
    }
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_state_save(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("cellingfan_state_save...\n");
	#endif

	array_write_uchar(res, 4); // state_save response

    uint8_t state_value = array_read_uchar(req);
    cellingfan_state_save_t state = *(cellingfan_state_save_t*)&state_value;

    if (state.setlight)
    {
        cellingfan_state.light = state.light;
        gpios_set_output_state(CELLINGFAN_LIGHT_PIN, cellingfan_state.light);
    }

    if (state.setfan)
    {
        cellingfan_state.fan = state.fan;
        gpios_set_output_state(CELLINGFAN_FAN_PIN, cellingfan_state.fan);
    }

    if (state.setfanUp)
    {
        cellingfan_state.fanUp = state.fanUp;
        gpios_set_output_state(CELLINGFAN_FAN_DIRECTION_PIN, cellingfan_state.fanUp);
    }

    if (state.fanSpeed != cellingfan_state_fanSpeed_notset)
    {
        cellingfan_state.fanSpeed = state.fanSpeed;
        cellingfan_set_fanspeed_state();
    }
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_light_button_cb()
{
    if (cellingfan_state.light)
    {
        cellingfan_state.light = 0;
        gpios_set_output_low(CELLINGFAN_LIGHT_PIN);
    }
    else
    {
        cellingfan_state.light = 1;
        gpios_set_output_high(CELLINGFAN_LIGHT_PIN);
    }
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_fan_button_cb()
{
    if (cellingfan_state.fan)
    {
        cellingfan_state.fan = 0;
        gpios_set_output_low(CELLINGFAN_FAN_PIN);
    }
    else
    {
        cellingfan_state.fan = 1;
        gpios_set_output_high(CELLINGFAN_FAN_PIN);
    }
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_fanspeed_button_cb()
{
    cellingfan_state.fanSpeed++;
    if (cellingfan_state.fanSpeed == 3)
    {
        cellingfan_state.fanSpeed = 0;
    }
    cellingfan_set_fanspeed_state();
}

/******************************* PUBLIC METHODS *************************************/

ICACHE_FLASH_ATTR
void cellingfan_init_gpios(void)
{
    gpios_set_output_mode(CELLINGFAN_LIGHT_PIN, 0);
    gpios_set_output_mode(CELLINGFAN_FAN_PIN, 0);
    gpios_set_output_mode(CELLINGFAN_FAN_DIRECTION_PIN, 0);
    gpios_set_output_mode(CELLINGFAN_FAN_SPEED_MIX_PIN, 0);
    gpios_set_output_mode(CELLINGFAN_FAN_SPEED_MAX_PIN, 0);

    gpios_set_button_intr(CELLINGFAN_LIGHT_BUTTON_PIN, cellingfan_light_button_cb);
    gpios_set_button_intr(CELLINGFAN_FAN_BUTTON_PIN, cellingfan_fan_button_cb);
    gpios_set_button_pulsar(CELLINGFAN_FAN_SPEED_BUTTON_PIN, cellingfan_fanspeed_button_cb);
}

ICACHE_FLASH_ATTR
void cellingfan_init(void)
{
	#ifdef DEBUG
		os_printf("cellingfan_init...\n");
	#endif

}

ICACHE_FLASH_ATTR
void cellingfan_msg_handler(array_builder_t* req, array_builder_t* res)
{
	uint8 msg = array_read_uchar(req);

	switch (msg)
	{
		case 1: cellingfan_state_read(req, res); break;
		case 3: cellingfan_state_save(req, res); break;
	}
}