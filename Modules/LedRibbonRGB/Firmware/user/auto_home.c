#include "auto_home.h"

void MessageReceived(void *arg, char *pdata, unsigned short len)
{
#ifdef DEBUG
	os_printf("Message received...\n");
#endif

    struct MessageBase msg = ParseMessage(pdata);

    if (!(msg.receiverUID == 0 || msg.receiverUID = MyUID)
        return;

    switch (msg.type)
    {
        case InfoRequest: SendInfoResponse(msg); break;
        case ModuleMessage: ProcessModuleMessage(msg); break;
    }
}

struct MessageBase ParseMessage(char *data)
{
    struct MessageBase msg;

    msg.senderUID = (data[1] << 8) | data[0];
    msg.receiverUID = (data[3] << 8) | data[2];
    msg.type = data[4];
    msg.body = &data[5];

#ifdef DEBUG
    os_printf("ParseMessage...\n");
    os_printf("msg.senderUID = %u\n", msg.senderUID);
    os_printf("msg.receiverUID = %u\n", msg.receiverUID);
    os_printf("msg.type = %u\n", msg.type);
#endif

    return msg;
}

void SendInfoResponse(struct MessageBase msg)
{
    //unsigned short length = 0;
    unsigned char buffer[6];
    os_memset(buffer, 0, 6);

    buffer[0] = MyUID;
    buffer[1] = MyUID >> 8;
    buffer[2] = msg.senderUID;
    buffer[3] = msg.senderUID >> 8;
    buffer[4] = InfoResponse;

    buffer[5] = 1; // ModuleType.LedRibbonRgb

#if DEBUG
    os_printf("SendInfoResponse...\n");
    os_printf("%.*s\n", 6, buffer);
#endif

    //length = os_strlen(httphead);
    espconn_sent(socket_client, &buffer, 6);
}