#ifndef __AUTO_HOME_H__
#define __AUTO_HOME_H__

#include "espconn.h"

// Configuration
#define MyUID 0;
struct espconn *socket_client;
autohome_process_msg_cb autohome_process_msg;

enum MessageType {
    Nop = 0,
    InfoRequest = 1,
    InfoResponse = 2,
    ApiPing = 3,
    ApiPong = 4,
    ModuleMessage = 50
};

struct MessageBase {
    unsigned short senderUID;
    unsigned short receiverUID;
    enum MessageType type;
    char *body;
};

typedef void (*autohome_process_msg_cb)(struct MessageBase msg);

void MessageReceived(void *arg, char *pdata, unsigned short len);
struct MessageBase ParseMessage(char *data);
void SendInfoResponse(struct MessageBase msg);

#endif