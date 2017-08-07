#ifndef __AUTOHOME_H__
#define __AUTOHOME_H__

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
    MT_FotaWriteResponse = 10
};

struct MessageBase {
    unsigned char UID;
    enum MessageType type;
    char *body;
};

void autohome_udp_recv(remot_info *pcon_info, char *data, unsigned short len);

void autohome_tcp_recv(struct espconn *pesp_conn, char *data, unsigned short len);

#endif