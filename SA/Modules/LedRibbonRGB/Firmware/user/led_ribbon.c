#define USE_US_TIMER

#include "ets_sys.h"
#include "osapi.h"
#include "user_interface.h"
#include "espconn.h"
#include "gpio.h"
#include "mem.h"
#include "autohome.h"
#include "led_ribbon.h"



// ############################## COLOR_HANDLE

ICACHE_FLASH_ATTR
void set_pin_state(struct color_struct *color) {
    os_timer_disarm(&color->timer);

    if (color->highValue) {
        #ifdef LED_INVERSE_SIGNAL
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 0);
        #else
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 1);
        #endif
        color->state = 1;

        if (color->lowValue) {
            os_timer_arm_us(&color->timer, color->highValue, 0);
        }
    }
    else {
        #ifdef LED_INVERSE_SIGNAL
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 1);
        #else
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 0);
        #endif
        color->state = 0;
    }
}

void pin_event(struct color_struct *color) {
    os_timer_disarm(&color->timer);

    if (color->state) {
        #ifdef LED_INVERSE_SIGNAL
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 1);
        #else
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 0);
        #endif
        color->state = 0;
        os_timer_arm_us(&color->timer, color->lowValue, 0);
    }
    else {
        #ifdef LED_INVERSE_SIGNAL
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 0);
        #else
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 1);
        #endif
        color->state = 1;
        os_timer_arm_us(&color->timer, color->highValue, 0);
    }
}

// ############################## END COLOR_HANDLE





// ############################## MESSAGES

ICACHE_FLASH_ATTR
void ledRibbonReadState(struct espconn *pesp_conn) {
    #ifdef DEBUG
        os_printf("ledRibbonReadState...\n");
        os_printf("redPin.lowValue: %u\n", redPin.lowValue);
        os_printf("redPin.highValue: %u\n", redPin.highValue);
        os_printf("greenPin.lowValue: %u\n", greenPin.lowValue);
        os_printf("greenPin.highValue: %u\n", greenPin.highValue);
        os_printf("bluePin.lowValue: %u\n", bluePin.lowValue);
        os_printf("bluePin.highValue: %u\n", bluePin.highValue);
    #endif

    uint8 totalBuffer = 2 + 24;
    uint8 pos = 0;

    uint8* buffer = (uint8*)os_zalloc(totalBuffer);
    buffer[pos++] = MYUID;
    buffer[pos++] = MT_RGBLedRibbonReadStateResponse;

    buffer[pos++] = redPin.lowValue;
    buffer[pos++] = redPin.lowValue >> 8;
    buffer[pos++] = redPin.lowValue >> 16;
    buffer[pos++] = redPin.lowValue >> 24;
    buffer[pos++] = redPin.highValue;
    buffer[pos++] = redPin.highValue >> 8;
    buffer[pos++] = redPin.highValue >> 16;
    buffer[pos++] = redPin.highValue >> 24;

    buffer[pos++] = greenPin.lowValue;
    buffer[pos++] = greenPin.lowValue >> 8;
    buffer[pos++] = greenPin.lowValue >> 16;
    buffer[pos++] = greenPin.lowValue >> 24;
    buffer[pos++] = greenPin.highValue;
    buffer[pos++] = greenPin.highValue >> 8;
    buffer[pos++] = greenPin.highValue >> 16;
    buffer[pos++] = greenPin.highValue >> 24;

    buffer[pos++] = bluePin.lowValue;
    buffer[pos++] = bluePin.lowValue >> 8;
    buffer[pos++] = bluePin.lowValue >> 16;
    buffer[pos++] = bluePin.lowValue >> 24;
    buffer[pos++] = bluePin.highValue;
    buffer[pos++] = bluePin.highValue >> 8;
    buffer[pos++] = bluePin.highValue >> 16;
    buffer[pos++] = bluePin.highValue >> 24;

    espconn_sent(pesp_conn, buffer, totalBuffer);
    os_free(buffer);
}

ICACHE_FLASH_ATTR
void ledRibbonChange(char* data) {
    #ifdef DEBUG
        os_printf("ledRibbonChange...\n");
    #endif

    uint32 low = 0;
    uint32 high = 0;

    low = (data[3] << 24) | (data[2] << 16) | (data[1] << 8) | data[0];
    high = (data[7] << 24) | (data[6] << 16) | (data[5] << 8) | data[4];
    redPin.lowValue = low;
    redPin.highValue = high;

    low = (data[11] << 24) | (data[10] << 16) | (data[9] << 8) | data[8];
    high = (data[15] << 24) | (data[14] << 16) | (data[13] << 8) | data[12];
    greenPin.lowValue = low;
    greenPin.highValue = high;

    low = (data[19] << 24) | (data[18] << 16) | (data[17] << 8) | data[16];
    high = (data[23] << 24) | (data[22] << 16) | (data[21] << 8) | data[20];
    bluePin.lowValue = low;
    bluePin.highValue = high;

    #ifdef DEBUG
        os_printf("redPin.lowValue: %u\n", redPin.lowValue);
        os_printf("redPin.highValue: %u\n", redPin.highValue);
        os_printf("greenPin.lowValue: %u\n", greenPin.lowValue);
        os_printf("greenPin.highValue: %u\n", greenPin.highValue);
        os_printf("bluePin.lowValue: %u\n", bluePin.lowValue);
        os_printf("bluePin.highValue: %u\n", bluePin.highValue);
    #endif

    set_pin_state(&redPin);
    set_pin_state(&greenPin);
    set_pin_state(&bluePin);

    if (redPin.highValue > 0 || greenPin.highValue > 0 || bluePin.highValue > 0) {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(12), 1);
    }
    else {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(12), 0);
    }
}

// ############################## END MESSAGES





// ############################## PUBLIC

ICACHE_FLASH_ATTR
void ledRibbon_initialize(void) {
    #ifdef DEBUG
        os_printf("ledRibbon_initialize...\n");
    #endif

    os_timer_setfn(&redPin.timer, (os_timer_func_t*)pin_event, &redPin);
    os_timer_setfn(&bluePin.timer, (os_timer_func_t*)pin_event, &bluePin);
    os_timer_setfn(&greenPin.timer, (os_timer_func_t*)pin_event, &greenPin);

    ledRibbon_set_off();
}

ICACHE_FLASH_ATTR
void ledRibbon_set_off(void) {
    #ifdef DEBUG
        os_printf("ledRibbon_set_off...\n");
    #endif

    #ifdef LED_INVERSE_SIGNAL
    GPIO_OUTPUT_SET(GPIO_ID_PIN(redPin.pin), 1);
    GPIO_OUTPUT_SET(GPIO_ID_PIN(bluePin.pin), 1);
    GPIO_OUTPUT_SET(GPIO_ID_PIN(greenPin.pin), 1);
    #else
    GPIO_OUTPUT_SET(GPIO_ID_PIN(redPin.pin), 0);
    GPIO_OUTPUT_SET(GPIO_ID_PIN(bluePin.pin), 0);
    GPIO_OUTPUT_SET(GPIO_ID_PIN(greenPin.pin), 0);
    #endif
    os_timer_disarm(&redPin.timer);
    os_timer_disarm(&bluePin.timer);
    os_timer_disarm(&greenPin.timer);
}

// ############################## END PUBLIC
