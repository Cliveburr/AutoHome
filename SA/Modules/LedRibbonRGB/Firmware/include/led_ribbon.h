#ifndef __LED_RIBBON_H__
#define __LED_RIBBON_H__

/* *** Config section *** */

/* To use the led ribbon, must define this in user_config.h

/* Must define USE_US_TIMER into user_main.c
#define USE_US_TIMER

/* Must call "system_timer_reinit()" in first line of user_main.c

/* Must define and configure the pins

/* Must call "ledRibbon_initialize()" at start

*/

enum LedribbonRGBContentType {
    StateRequest = 1,
    StateResponse = 2,
    StateChange = 3
};

struct LedribbonRGBContent {
    enum LedribbonRGBContentType type;
    char *body;
};

struct LedribbonRGBStateContent {
    uint32_t redLow;
    uint32_t redHigh;
    uint32_t greenLow;
    uint32_t greenHigh;
    uint32_t blueLow;
    uint32_t blueHigh;
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

void ledRibbon_initialize(void);
void ledRibbon_set_off(void);

void process_module_message(struct MessageBase msg);
struct LedribbonRGBContent parse_content(char *data);
void send_response_state(struct MessageBase msg);
void process_change_state(struct MessageBase msg, struct LedribbonRGBContent content);
struct LedribbonRGBStateContent parse_state_content(char *data);

#endif