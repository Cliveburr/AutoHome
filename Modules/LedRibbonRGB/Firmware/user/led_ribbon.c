#include "auto_home.h"
#include "led_ribbon.h";

void LedRibbonInitialize() {
    system_timer_reinit();

    redPin.pin = REDPIN;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, REDFUNC);
    os_timer_setfn(&redPin.timer, (os_timer_func_t*)PinEvent, &redPin);

    bluePin.pin = BLUEPIN;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, BLUEFUNC);
    os_timer_setfn(&bluePin.timer, (os_timer_func_t*)PinEvent, &bluePin);

    greenPin.pin = GREENPIN;
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, GREENFUNC);
    os_timer_setfn(&greenPin.timer, (os_timer_func_t*)PinEvent, &greenPin);

    autohome_process_msg_cb = ProcessModuleMessage;
}

void ProcessModuleMessage(struct MessageBase msg) {
    struct LedribbonRGBContent content = ParseContent(msg.body);
    
    switch (content.type)
    {
        case StateRequest: SendResponseState(msg); break;
        case StateChange: ProcessChangeState(msg, content); break;
    }
}

struct LedribbonRGBContent ParseContent(char *data) {
    struct LedribbonRGBContent content;

    content.type = data[0];
    content.body = &data[5];

#ifdef DEBUG
    os_printf("ParseContent...\n");
    os_printf("content.type = %u\n", content.type);
#endif

    return content;
}

struct LedribbonRGBStateContent ParseStateContent(char *data) {
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

    return content;
}

void SendResponseState(struct LanMessage msg) {
    unsigned char buffer[30];
    os_memset(buffer, 0, 30);

    buffer[0] = MyUID;
    buffer[1] = MyUID >> 8;
    buffer[2] = lanMsg.senderUID;
    buffer[3] = lanMsg.senderUID >> 8;
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

#if DEBUG
    os_printf("SendResponseState...\n");
    os_printf("%.*s\n", 30, buffer);
#endif

    espconn_sent(socket_client, &buffer, 30);
}

void ProcessChangeState(struct LanMessage msg, struct LedribbonRGBContent content) {
    struct LedribbonRGBStateContent stateContent = ParseStateContent(content.body);

    redPin.lowValue = stateContent.redLow;
    redPin.highValue = stateContent.redHigh;

    greenPin.lowValue = stateContent.greenLow;
    greenPin.highValue = stateContent.greenHigh;

    bluePin.lowValue = stateContent.blueLow;
    bluePin.highValue = stateContent.blueHigh;

    SetPinState(&redPin);
    SetPinState(&greenPin);
    SetPinState(&bluePin);
}

void SetPinState(struct color_struct *color) {
    os_timer_disarm(&color->timer);

    if (color->highValue)
    {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 1);
        color->state = 1;

        if (color->lowValue)
            os_timer_arm_us(&color->timer, color->highValue, 0);
    }
    else
    {
        GPIO_OUTPUT_SET(GPIO_ID_PIN(color->pin), 0);
        color->state = 0;
    }
}

void PinEvent(struct color_struct *color) {
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