#include "osapi.h"
#include "user_interface.h"
#include "driver/gpio16.h"
#include "mem.h"

#include "helpers/gpios.h"
#include "user_config.h"

gpios_intr_t** gpios_intrs;
uint8_t gpios_intrs_count = 0;

/******************************* PRIVATE METHODS *************************************/

ICACHE_FLASH_ATTR
uint32_t get_pin_name(uint8_t gpio_id)
{
    switch (gpio_id)
    {
        case 02: return PERIPHS_IO_MUX_GPIO2_U;
        case 04: return PERIPHS_IO_MUX_GPIO4_U;
        case 05: return PERIPHS_IO_MUX_GPIO5_U;
        case 12: return PERIPHS_IO_MUX_MTDI_U;
        case 13: return PERIPHS_IO_MUX_MTCK_U;
        case 14: return PERIPHS_IO_MUX_MTMS_U;
        case 15: return PERIPHS_IO_MUX_MTDO_U;
    }
}

ICACHE_FLASH_ATTR
uint32_t get_gpio_func(uint8_t gpio_id)
{
    switch (gpio_id)
    {
        case 02: return FUNC_GPIO2;
        case 04: return FUNC_GPIO4;
        case 05: return FUNC_GPIO5;
        case 12: return FUNC_GPIO12;
        case 13: return FUNC_GPIO13;
        case 14: return FUNC_GPIO14;
        case 15: return FUNC_GPIO15;
    }
}

ICACHE_FLASH_ATTR
void set_pin_to_gpio_mode(uint8_t gpio_id)
{
    if (gpio_id == 16)
    {
        gpio16_output_conf();
    }
    else
    {
        PIN_FUNC_SELECT(get_pin_name(gpio_id), get_gpio_func(gpio_id));
    }
}

ICACHE_FLASH_ATTR
void set_pin_intr(gpios_intr_t* intr)
{
    // switch (intr->type)
    // {
    //     case gpios_type_pulsar:
    //     case gpios_type_intr:
    //     {
            //os_printf("gpios_type_intr: - pin: %d, intr->state: %d\n", intr->gpio_id, intr->state);
            if (intr->state)
            {
                gpio_pin_intr_state_set(GPIO_ID_PIN(intr->gpio_id), GPIO_PIN_INTR_LOLEVEL);
            }
            else
            {
                gpio_pin_intr_state_set(GPIO_ID_PIN(intr->gpio_id), GPIO_PIN_INTR_HILEVEL);
            }
            //break;
        // }
        // case gpios_type_pulsar:
        // {
        //     os_printf("gpios_type_pulsar: - pin: %d, intr->state: %d\n", intr->gpio_id, intr->state);
        //     gpio_pin_intr_state_set(GPIO_ID_PIN(intr->gpio_id), GPIO_PIN_INTR_LOLEVEL);
        //     break;
        // }
    // }
}


ICACHE_FLASH_ATTR
void gpios_timer_event_cb(void *arg)
{
    gpios_intr_t* intr = (gpios_intr_t*)arg;
    os_timer_disarm(&intr->timer);

    uint8_t state = GPIO_INPUT_GET(GPIO_ID_PIN(intr->gpio_id));
    os_printf("event - pin: %d, intr->state: %d\n", intr->gpio_id, intr->state);
    if (intr->type == gpios_type_pulsar)
    {
        if (state == 0 && state != intr->state) {
            intr->intr_cb();
        }
    }
    else
    {
        if (state != intr->state) {
            intr->intr_cb();
        }
    }

    intr->state = state;
    set_pin_intr(intr);
}

ICACHE_FLASH_ATTR
void gpios_intr_handler(void *arg)
{
    uint32_t gpio_status = GPIO_REG_READ(GPIO_STATUS_ADDRESS);
    uint8_t i;

    for (i = 0; i < gpios_intrs_count; i++)
    {
        gpios_intr_t* intr = gpios_intrs[i];
        if (gpio_status & BIT(intr->gpio_id)) {
            gpio_pin_intr_state_set(GPIO_ID_PIN(intr->gpio_id), GPIO_PIN_INTR_DISABLE);
            GPIO_REG_WRITE(GPIO_STATUS_W1TC_ADDRESS, gpio_status & BIT(intr->gpio_id));

            os_timer_disarm(&intr->timer);
            switch (intr->type)
            {
                case gpios_type_intr:
                {
                    os_timer_arm(&intr->timer, 150, 0);
                    break;
                }
                case gpios_type_pulsar:
                {
                    os_timer_arm(&intr->timer, 30, 0);
                    break;
                }
            }
        }
    }
}

ICACHE_FLASH_ATTR
void gpios_set_button(gpios_intr_type_t type, uint8_t gpio_id, gpios_intr_function intr_cb)
{
    switch (gpio_id)
    {
        case 02:
        case 15:
        case 16:
            os_printf("ERROR: INVALID gpio %d to interrupt!\n", gpio_id);
            return;
    }

    ETS_GPIO_INTR_DISABLE();
    if (gpios_intrs_count == 0)
    {
        ETS_GPIO_INTR_ATTACH(gpios_intr_handler, NULL);
    }

    set_pin_to_gpio_mode(gpio_id);
    GPIO_DIS_OUTPUT(GPIO_ID_PIN(gpio_id));
    PIN_PULLUP_EN(get_pin_name(gpio_id));

    gpios_intrs_count++;
    if (gpios_intrs_count == 1)
    {
        gpios_intrs = (gpios_intr_t**)os_zalloc(sizeof(gpios_intr_t*));
    }
    else
    {
        gpios_intrs = (gpios_intr_t**)os_realloc(gpios_intrs, sizeof(gpios_intr_t*) * gpios_intrs_count);
    }

    gpios_intr_t* intr = (gpios_intr_t*)os_zalloc(sizeof(gpios_intr_t));
    gpios_intrs[gpios_intrs_count - 1] = intr;

    intr->gpio_id = gpio_id;
    intr->type = type;
    intr->intr_cb = intr_cb;
    intr->state = GPIO_INPUT_GET(GPIO_ID_PIN(gpio_id));
    os_timer_setfn(&intr->timer, (os_timer_func_t*)gpios_timer_event_cb, intr);
    set_pin_intr(intr);

    ETS_GPIO_INTR_ENABLE();
}

/******************************* PUBLIC METHODS *************************************/

ICACHE_FLASH_ATTR
void gpios_set_output_mode(uint8_t gpio_id, uint8_t state)
{
    set_pin_to_gpio_mode(gpio_id);
    gpios_set_output_state(gpio_id, state);
}

ICACHE_FLASH_ATTR
void gpios_set_output_state(uint8_t gpio_id, uint8_t state)
{
    //os_printf("output_state - ping: %d, state: %d\n", gpio_id, state);
    if (gpio_id == 16)
    {
        gpio16_output_set(state);
    }
    else
    {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(gpio_id), state);
    }
}

ICACHE_FLASH_ATTR
void gpios_set_output_high(uint8_t gpio_id)
{
    gpios_set_output_state(gpio_id, 1);
}

ICACHE_FLASH_ATTR
void gpios_set_output_low(uint8_t gpio_id)
{
    gpios_set_output_state(gpio_id, 0);
}

ICACHE_FLASH_ATTR
void gpios_set_button_intr(uint8_t gpio_id, gpios_intr_function intr_cb)
{
    gpios_set_button(gpios_type_intr, gpio_id, intr_cb);
}

ICACHE_FLASH_ATTR
void gpios_set_button_pulsar(uint8_t gpio_id, gpios_intr_function intr_cb)
{
    gpios_set_button(gpios_type_pulsar, gpio_id, intr_cb);
}
