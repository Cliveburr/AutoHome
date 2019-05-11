#ifndef __AUTOHOME_H__
#define __AUTOHOME_H__

#include "espconn.h"

/* *** Config section ***
    To use the autohome, must define this in user_config.h

/* *** autohome.h config *** *
#define VERSION_HIGH       0
#define VERSION_LOW        1
#define MODULE_ID          2    // TempHumiSensor = 2
/* *** end autohome.h config *** *

*/

void autohome_init(void);
void autohome_tcp_recv(struct espconn* pesp_conn, char* data);
void autohome_udp_recv(struct espconn* espconnv, remot_info* pcon_info, char* data);

#endif