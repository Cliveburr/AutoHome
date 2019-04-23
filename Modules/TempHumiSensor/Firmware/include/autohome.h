#ifndef __AUTOHOME_H__
#define __AUTOHOME_H__

typedef void (*Feature_Init_Delegate)();

typedef struct {
    Feature_Init_Delegate init;
} Feature;


void autohome_init(void msghandler(char*));

#endif