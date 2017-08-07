#ifndef __NET_H__
#define __NET_H__

/* *** Config section *** */

/* To use the net, must define this in user_config.h

#define MOD_SEND_PORT       15555
#define MOD_RECV_PORT       15556

*/

#include "espconn.h"

struct espconn udp_espconnv;
struct espconn tcp_espconnv;

enum net_mode_type {
    Net_AccessPoint = 0,
    Net_Station = 1
};

void set_accesspoint_mode(void);
void set_station_mode(void);
void stop_all(void);

#endif