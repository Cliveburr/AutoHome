#ifndef __AUTOHOME_H__
#define __AUTOHOME_H__

/* *** Config section *** */

/* To use the autohome, must define this in user_config.h

#define MYUID              1
#define VERSION_HIGH       0
#define VERSION_LOW        1
#define MODULE_TYPE        1    // LedRibbonRgb = 1

*/

#include "espconn.h"

enum MessageType {
    MT_Nop = 0,
    MT_Ping = 1,
    MT_Pong = 2,
    MT_ConfigurationReadRequest = 3,
    MT_ConfigurationReadResponse = 4,
    MT_ConfigurationSaveRequest = 5,
    MT_FotaStateReadRequest = 6,
    MT_FotaStateReadResponse = 7,
    MT_FotaStartRequest = 8,
    MT_FotaWriteRequest = 9,
    MT_FotaWriteResponse = 10,
    MT_RGBLedRibbonReadStateRequest = 11,
    MT_RGBLedRibbonReadStateResponse = 12,
    MT_RGBLedRibbonChangeRequest = 13
};

struct MessageBase {
    unsigned char UID;
    enum MessageType type;
    char *body;
};

void autohome_udp_recv(remot_info *pcon_info, char *data, unsigned short len);

void autohome_tcp_recv(struct espconn *pesp_conn, char *data, unsigned short len);

#endif