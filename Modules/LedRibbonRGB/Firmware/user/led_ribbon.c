#define USE_US_TIMER

#include "ets_sys.h"
#include "osapi.h"
#include "user_interface.h"
#include "espconn.h"
#include "gpio.h"
#include "auto_home.station.h"
#include "led_ribbon.h"

void ledRibbon_initialize(void) {

#ifdef DEBUG
    os_printf("ledRibbon_initialize...\n");
#endif

    redPin.pin = 14;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTMS_U, FUNC_GPIO14);
    os_timer_setfn(&redPin.timer, (os_timer_func_t*)pin_event, &redPin);

    bluePin.pin = 4;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO4);
    os_timer_setfn(&bluePin.timer, (os_timer_func_t*)pin_event, &bluePin);

    greenPin.pin = 5;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO5);
    os_timer_setfn(&greenPin.timer, (os_timer_func_t*)pin_event, &greenPin);

    set_off();
}

void set_off(void) {

#ifdef DEBUG
    os_printf("set_off...\n");
#endif

    GPIO_OUTPUT_SET(GPIO_ID_PIN(redPin.pin), 0);
    GPIO_OUTPUT_SET(GPIO_ID_PIN(bluePin.pin), 0);
    GPIO_OUTPUT_SET(GPIO_ID_PIN(greenPin.pin), 0);
    os_timer_disarm(&redPin.timer);
    os_timer_disarm(&bluePin.timer);
    os_timer_disarm(&greenPin.timer);
}

void set_normal_operation(void) {

#ifdef DEBUG
    os_printf("set_normal_operation...\n");
#endif

    set_pin_state(&redPin);
    set_pin_state(&greenPin);
    set_pin_state(&bluePin);
}

void set_pin_state(struct color_struct *color) {
    os_timer_disarm(&color->timer);

    if (color->highValue) {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 1);
        color->state = 1;

        if (color->lowValue)
            os_timer_arm_us(&color->timer, color->highValue, 0);
    }
    else {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 0);
        color->state = 0;
    }
}

void pin_event(struct color_struct *color) {
    os_timer_disarm(&color->timer);

    if (color->state) {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 0);
        color->state = 0;
        os_timer_arm_us(&color->timer, color->lowValue, 0);
    }
    else {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 1);
        color->state = 1;
        os_timer_arm_us(&color->timer, color->highValue, 0);
    }
}

/* ############################################# */
/*  NET PROCESS */

void process_module_message(struct MessageBase msg) {

#ifdef DEBUG
    os_printf("process_module_message...\n");
#endif
    
    struct LedribbonRGBContent content = parse_content(msg.body);
    
    switch (content.type)
    {
        case StateRequest: send_response_state(msg); break;
        case StateChange: process_change_state(msg, content); break;
    }
}

struct LedribbonRGBContent parse_content(char *data) {

#ifdef DEBUG
    os_printf("parse_content...\n");
#endif

    struct LedribbonRGBContent content;

    content.type = data[0];
    content.body = &data[1];

#ifdef DEBUG
    os_printf("content.type = %u\n", content.type);
#endif

    return content;
}

void send_response_state(struct MessageBase msg) {

#ifdef DEBUG
    os_printf("send_response_state...\n");
#endif

    if (!valid_api_addres())
        return;

    uint8 buffer[30] = {0};
    set_message_base(buffer, msg.senderUID);
    buffer[4] = ModuleMessage;
    buffer[5] = StateResponse;

    buffer[6] = redPin.lowValue;
    buffer[7] = redPin.lowValue >> 8;
    buffer[8] = redPin.lowValue >> 16;
    buffer[9] = redPin.lowValue >> 24;
    buffer[10] = redPin.highValue;
    buffer[11] = redPin.highValue >> 8;
    buffer[12] = redPin.highValue >> 16;
    buffer[13] = redPin.highValue >> 24;

    buffer[14] = greenPin.lowValue;
    buffer[15] = greenPin.lowValue >> 8;
    buffer[16] = greenPin.lowValue >> 16;
    buffer[17] = greenPin.lowValue >> 24;
    buffer[18] = greenPin.highValue;
    buffer[19] = greenPin.highValue >> 8;
    buffer[20] = greenPin.highValue >> 16;
    buffer[21] = greenPin.highValue >> 24;

    buffer[22] = bluePin.lowValue;
    buffer[23] = bluePin.lowValue >> 8;
    buffer[24] = bluePin.lowValue >> 16;
    buffer[25] = bluePin.lowValue >> 24;
    buffer[26] = bluePin.highValue;
    buffer[27] = bluePin.highValue >> 8;
    buffer[28] = bluePin.highValue >> 16;
    buffer[29] = bluePin.highValue >> 24;

#ifdef DEBUG
    os_printf("buffer: "); print_buffer(buffer, 30);
#endif

    os_memcpy(udp_client.proto.udp->remote_ip, config.api_address, 4);
    udp_client.proto.udp->remote_port = SEND_PORT;
    espconn_sent(&udp_client, buffer, 30);
}

struct LedribbonRGBStateContent parse_state_content(char *data) {

#ifdef DEBUG
    os_printf("parse_state_content...\n");
#endif

    struct LedribbonRGBStateContent content;

    uint32_t low = 0;
    uint32_t high = 0;

    low = (data[3] << 24) | (data[2] << 16) | (data[1] << 8) | data[0];
    high = (data[7] << 24) | (data[6] << 16) | (data[5] << 8) | data[4];
    content.redLow = low;
    content.redHigh = high;

    low = (data[11] << 24) | (data[10] << 16) | (data[9] << 8) | data[8];
    high = (data[15] << 24) | (data[14] << 16) | (data[13] << 8) | data[12];
    content.greenLow = low;
    content.greenHigh = high;

    low = (data[19] << 24) | (data[18] << 16) | (data[17] << 8) | data[16];
    high = (data[23] << 24) | (data[22] << 16) | (data[21] << 8) | data[20];
    content.blueLow = low;
    content.blueHigh = high;

#ifdef DEBUG
    os_printf("content.redLow: %u\n", content.redLow);
    os_printf("content.redHigh: %u\n", content.redHigh);
    os_printf("content.greenLow: %u\n", content.greenLow);
    os_printf("content.greenHigh: %u\n", content.greenHigh);
    os_printf("content.blueLow: %u\n", content.blueLow);
    os_printf("content.redLow: %u\n", content.blueHigh);
#endif

    return content;
}


void process_change_state(struct MessageBase msg, struct LedribbonRGBContent content) {

#ifdef DEBUG
    os_printf("process_change_state...\n");
#endif

    struct LedribbonRGBStateContent stateContent = parse_state_content(content.body);

    redPin.lowValue = stateContent.redLow;
    redPin.highValue = stateContent.redHigh;

    greenPin.lowValue = stateContent.greenLow;
    greenPin.highValue = stateContent.greenHigh;

    bluePin.lowValue = stateContent.blueLow;
    bluePin.highValue = stateContent.blueHigh;

    set_pin_state(&redPin);
    set_pin_state(&greenPin);
    set_pin_state(&bluePin);
}