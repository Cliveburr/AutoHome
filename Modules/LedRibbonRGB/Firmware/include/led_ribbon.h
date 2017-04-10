#ifndef __LED_RIBBON_H__
#define __LED_RIBBON_H__

enum LedribbonRGBContentType {
    Nop = 0,
    StateRequest = 1,
    StateResponse = 2,
    StateChange = 3
};

struct LedribbonRGBContent {
    enum LedribbonRGBContentType type;
    char *body;
};

struct LedribbonRGBStateContent {
    unsigned int redLow;
    unsigned int redHigh;
    unsigned int greenLow;
    unsigned int greenHigh;
    unsigned int blueLow;
    unsigned int blueHigh;
};

struct color_struct {
    char pin;
    char state;
    os_timer_t timer;
    uint32_t lowValue;
    uint32_t highValue;
};

struct color_struct bluePin;
struct color_struct greenPin;
struct color_struct redPin;

void LedRibbonInitialize();
void ProcessModuleMessage(struct MessageBase msg);
struct LedribbonRGBContent ParseContent(char *data);
struct LedribbonRGBStateContent ParseStateContent(char *data);
void SendResponseState(struct LanMessage msg);
void ProcessChangeState(struct LanMessage msg, struct LedribbonRGBContent content)
void SetPinState(struct color_struct *color);
void PinEvent(struct color_struct *color);

#endif