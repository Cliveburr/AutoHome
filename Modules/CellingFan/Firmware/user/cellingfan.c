#include "osapi.h"

#include "gpio.h"

#include "helpers/gpios.h"
#include "helpers/storage.h"
#include "cellingfan.h"

typedef enum {
    cellingfan_message_type_state_read_request = 1,
    cellingfan_message_type_state_read_response = 2,
    cellingfan_message_type_state_save_request = 3,
    cellingfan_message_type_state_save_response = 4,
    cellingfan_message_type_config_read_request = 5,
    cellingfan_message_type_config_read_response = 6,
    cellingfan_message_type_config_save_request = 7
} cellingfan_message_type_t;

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
LOCAL os_timer_t cellingfan_block_inversion_timer;
LOCAL uint8_t cellingfan_inversion_intr;
LOCAL os_timer_t cellingfan_block_fanonof_timer;
LOCAL uint8_t cellingfan_block_fanonof;

LOCAL ICACHE_FLASH_ATTR
void cellingfan_config_read(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("cellingfan_config_read...\n");
	#endif

	array_write_uchar(res, cellingfan_message_type_config_read_response);

    uint8_t pins;
    os_memcpy(&pins, &cellingfan_config->pins, 1);
    array_write_uchar(res, pins);
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_config_save(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("cellingfan_config_save...\n");
	#endif

    uint8_t pins = array_read_uchar(req);
    os_memcpy(&cellingfan_config->pins, &pins, 1);

    storage_write("cellingfan", cellingfan_config);
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_state_read(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("cellingfan_state_read...\n");
	#endif

	array_write_uchar(res, cellingfan_message_type_state_read_response);

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
void cellingfan_set_light_state(uint8_t value)
{
    if (cellingfan_state.light == value)
    {
        return;
    }

    cellingfan_state.light = value;
    gpios_set_output_state(CELLINGFAN_LIGHT_PIN, cellingfan_state.light);
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_set_fan_state(uint8_t value)
{
    if (cellingfan_state.fan == value || cellingfan_block_fanonof)
    {
        return;
    }

    cellingfan_state.fan = value;
    gpios_set_output_state(CELLINGFAN_FAN_PIN, cellingfan_state.fan);
    
    cellingfan_block_fanonof = 1;
    os_timer_arm(&cellingfan_block_fanonof_timer, 3000, 0);

    if (cellingfan_state.fan == 0) {
        cellingfan_inversion_intr = 1;
        os_timer_arm(&cellingfan_block_inversion_timer, 30000, 0);
    }
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_set_fanUp_state(uint8_t value)
{
    if (cellingfan_state.fanUp == value || cellingfan_state.fan || cellingfan_inversion_intr)
    {
        return;
    }

    cellingfan_state.fanUp = value;
    gpios_set_output_state(CELLINGFAN_FAN_DIRECTION_PIN, cellingfan_state.fanUp ^ cellingfan_config->pins.FW1FW2Inversion);
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_set_fanspeed_state(uint8_t value)
{
    if (cellingfan_state.fanSpeed == value || cellingfan_state.fan)
    {
        return;
    }

    cellingfan_state.fanSpeed = value;
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
            gpios_set_output_low(CELLINGFAN_FAN_SPEED_MIX_PIN);
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

	array_write_uchar(res, cellingfan_message_type_state_save_response);

    uint8_t state_value = array_read_uchar(req);
    cellingfan_state_save_t state = *(cellingfan_state_save_t*)&state_value;

    if (state.setlight)
    {
        cellingfan_set_light_state(state.light);
    }

    if (state.setfanUp)
    {
        cellingfan_set_fanUp_state(state.fanUp);
    }

    if (state.fanSpeed != cellingfan_state_fanSpeed_notset)
    {
        cellingfan_set_fanspeed_state(state.fanSpeed);
    }

    if (state.setfan)
    {
        cellingfan_set_fan_state(state.fan);
    }

    array_write_uchar(res, *(uint8_t*)&cellingfan_state);
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_light_button_cb()
{
    if (!cellingfan_config->pins.interruptionsOnOff)
    {
        return;
    }

    cellingfan_set_light_state(cellingfan_state.light ^ 1);
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_fan_button_cb()
{
    if (!cellingfan_config->pins.interruptionsOnOff)
    {
        return;
    }
    
    cellingfan_set_fan_state(cellingfan_state.fan ^ 1);
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_fanspeed_button_cb()
{
    if (!cellingfan_config->pins.interruptionsOnOff)
    {
        return;
    }

    if (cellingfan_state.fanSpeed < 2)
    {
        cellingfan_set_fanspeed_state(cellingfan_state.fanSpeed + 1);
    }
    else
    {
        cellingfan_set_fanspeed_state(0);
    }
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_block_invert_event_cb(void *arg)
{
    cellingfan_inversion_intr = 0;
    os_timer_disarm(&cellingfan_block_inversion_timer);
}

LOCAL ICACHE_FLASH_ATTR
void cellingfan_block_fanonof_event_cb()
{
    cellingfan_block_fanonof = 0;
    os_timer_disarm(&cellingfan_block_fanonof_timer);
}

/******************************* PUBLIC METHODS *************************************/

ICACHE_FLASH_ATTR
void cellingfan_init(void)
{
	#ifdef DEBUG
		os_printf("cellingfan_init...\n");
	#endif

    cellingfan_config = storage_read("cellingfan");

    gpios_set_output_mode(CELLINGFAN_LIGHT_PIN, 0);
    gpios_set_output_mode(CELLINGFAN_FAN_PIN, 0);
    gpios_set_output_mode(CELLINGFAN_FAN_DIRECTION_PIN, 0 ^ cellingfan_config->pins.FW1FW2Inversion);
    gpios_set_output_mode(CELLINGFAN_FAN_SPEED_MIX_PIN, 0);
    gpios_set_output_mode(CELLINGFAN_FAN_SPEED_MAX_PIN, 0);

    gpios_set_button_intr(CELLINGFAN_LIGHT_BUTTON_PIN, cellingfan_light_button_cb);
    if (cellingfan_config->pins.FI1FI2Inversion)
    {
        gpios_set_button_intr(CELLINGFAN_FAN_SPEED_BUTTON_PIN, cellingfan_fan_button_cb);
        gpios_set_button_pulsar(CELLINGFAN_FAN_BUTTON_PIN, cellingfan_fanspeed_button_cb);
    }
    else
    {
        gpios_set_button_intr(CELLINGFAN_FAN_BUTTON_PIN, cellingfan_fan_button_cb);
        gpios_set_button_pulsar(CELLINGFAN_FAN_SPEED_BUTTON_PIN, cellingfan_fanspeed_button_cb);
    }

    os_timer_setfn(&cellingfan_block_inversion_timer, (os_timer_func_t*)cellingfan_block_invert_event_cb, NULL);
    os_timer_setfn(&cellingfan_block_fanonof_timer, (os_timer_func_t*)cellingfan_block_fanonof_event_cb, NULL);
}

ICACHE_FLASH_ATTR
void cellingfan_msg_handler(array_builder_t* req, array_builder_t* res)
{
	uint8 msg = array_read_uchar(req);

	switch (msg)
	{
		case cellingfan_message_type_state_read_request: cellingfan_state_read(req, res); break;
		case cellingfan_message_type_state_save_request: cellingfan_state_save(req, res); break;
        case cellingfan_message_type_config_read_request: cellingfan_config_read(req, res); break;
        case cellingfan_message_type_config_save_request: cellingfan_config_save(req, res); break;
	}
}