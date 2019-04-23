#ifndef __AUTO_HOME_STATION_H__
#define __AUTO_HOME_STATION_H__

#include "espconn.h"

// The UID of this AutoHome Module *** MUST BE UNIQUE ***
uint8 MyUID;

// autohome_process_msg_cb autohome_process_msg;

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

struct espconn udp_client;

void set_station_mode(void);
void station_handle_event_cb(System_Event_t *evt);
uint8 valid_api_addres(void);
void station_udp_handle_event_cb(void *arg, char *pdata, unsigned short len);
void messageReceived(void *arg, char *pdata, unsigned short len);
struct MessageBase parseMessage(char *data);
void send_ping_broadcast(void);
void set_message_base(uint8 *msg, uint8 toUID);
void print_buffer(uint8 *buf, uint8 len);
void sendInfoResponse(struct MessageBase msg);
void processPongMessage(struct MessageBase msg);

// typedef void (*autohome_process_msg_cb)(struct MessageBase msg);

#endif