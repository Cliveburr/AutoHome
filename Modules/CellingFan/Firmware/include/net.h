#ifndef __NET_H__
#define __NET_H__

/* *** Config section *** 
    To use the net, must define this in user_config.h

/* *** net config *** *
#define MOD_SEND_PORT       15555
#define MOD_RECV_PORT       15556
/* *** end net config *** *

*/

void net_init(void);
void net_start_accesspoint(void);
void net_start_station(void);
void net_stop_all(void);

#endif