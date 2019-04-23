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

#define LED_INVERSE_SIGNAL

struct color_struct {
    char pin;
    char state;
    os_timer_t timer;
    uint32 lowValue;
    uint32 highValue;
};

struct color_struct bluePin;
struct color_struct greenPin;
struct color_struct redPin;

void ledRibbon_initialize(void);
void ledRibbon_set_off(void);
void ledRibbonReadState(struct espconn *pesp_conn);
void ledRibbonChange(char* data);

#endif