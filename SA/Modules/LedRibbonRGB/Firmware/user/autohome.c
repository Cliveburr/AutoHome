#include "c_types.h"
#include "user_interface.h"
#include "espconn.h"
#include "osapi.h"
#include "mem.h"
#include "user_config.h"
#include "net.h"
#include "autohome.h"
#include "fota.h"
#include "led_ribbon.h"


// ############################## MESSAGES

ICACHE_FLASH_ATTR
struct MessageBase* parseMessage(char *data) {

    struct MessageBase* msg = (struct MessageBase*)os_zalloc(sizeof(struct MessageBase));

    msg->UID = data[0];
    msg->type = data[1];
    msg->body = &data[2];

#ifdef DEBUG
    os_printf("parseMessage...\n");
    os_printf("msg->UID = %u\n", msg->UID);
    os_printf("msg->type = %u\n", msg->type);
#endif

    return msg;
}

ICACHE_FLASH_ATTR
char valid_uid(struct MessageBase* msg) {
    if (msg->UID == 0 || msg->UID == MYUID) {
        return 1;
    }
    else {
        return 0;
    }
}

// ############################## END MESSAGES





// ############################## UDP

ICACHE_FLASH_ATTR
void autohome_udp_recv(remot_info *pcon_info, char *data, unsigned short len) {
    
    struct MessageBase* msg = parseMessage(data);

    if (valid_uid(msg)) {
        if (msg->type != MT_Ping) {
            return;
        }

        if (os_strncmp(msg->body, "PING", 4) != 0) {
            return;
        }

        os_memcpy(udp_espconnv.proto.udp->remote_ip, pcon_info->remote_ip, 4);

        #ifdef DEBUG
            os_printf("send to %d.%d.%d.%d:%d\n",
                udp_espconnv.proto.udp->remote_ip[0],
                udp_espconnv.proto.udp->remote_ip[1],
                udp_espconnv.proto.udp->remote_ip[2],
                udp_espconnv.proto.udp->remote_ip[3],
                udp_espconnv.proto.udp->remote_port);
        #endif

        uint8 aliasLen = os_strlen(config.alias);
        uint8 totalBuffer = 7 + 1 + aliasLen;

        uint8* buffer = (uint8*)os_zalloc(totalBuffer);
        buffer[0] = MYUID;
        buffer[1] = MT_Pong;
        os_sprintf(&buffer[2], "PONG", 4);

        buffer[6] = MODULE_TYPE;

        buffer[7] = aliasLen;
        os_memcpy(&buffer[8], config.alias, aliasLen);

        espconn_sent(&udp_espconnv, buffer, totalBuffer);
        os_free(buffer);

        os_free(msg);
    }
}

// ############################## END UDP





// ############################## TCP

ICACHE_FLASH_ATTR
void configurationRead(struct espconn *pesp_conn) {
    #ifdef DEBUG
        os_printf("configurationRead...\n");
    #endif

    uint8 wifiNameLen = os_strlen(config.net_ssid);
    uint8 wifiPassLen = os_strlen(config.net_password);
    uint8 aliasLen = os_strlen(config.alias);
    uint8 totalBuffer = 2 + 3 + wifiNameLen + wifiPassLen + aliasLen;

    uint8* buffer = (uint8*)os_zalloc(totalBuffer);
    buffer[0] = MYUID;
    buffer[1] = MT_ConfigurationReadResponse;

    uint8 pos = 2;

    buffer[pos++] = wifiNameLen;
    os_memcpy(&buffer[pos], config.net_ssid, wifiNameLen);
    pos += wifiNameLen;

    buffer[pos++] = wifiPassLen;
    os_memcpy(&buffer[pos], config.net_password, wifiPassLen);
    pos += wifiPassLen;

    buffer[pos++] = aliasLen;
    os_memcpy(&buffer[pos], config.alias, aliasLen);

    espconn_sent(pesp_conn, buffer, totalBuffer);
    os_free(buffer);
}

ICACHE_FLASH_ATTR
void configurationSave(char* data) {
    #ifdef DEBUG
        os_printf("configurationSave...\n");
    #endif

    uint8 pos = 0;

    uint8 wifiNameLen = data[pos++];
    os_memset(config.net_ssid, 0, 32);
    os_memcpy(config.net_ssid, &data[pos], wifiNameLen);
    pos += wifiNameLen;

    uint8 wifiPassLen = data[pos++];
    os_memset(config.net_password, 0, 64);
    os_memcpy(config.net_password, &data[pos], wifiPassLen);
    pos += wifiPassLen;

    uint8 aliasLen = data[pos++];
    os_memset(config.alias, 0, 30);
    os_memcpy(config.alias, &data[pos], aliasLen);

    config_save();
}

void autohome_tcp_recv(struct espconn *pesp_conn, char *data, unsigned short len) {

    struct MessageBase* msg = parseMessage(data);

    if (valid_uid(msg)) {
        switch (msg->type) {
            case MT_ConfigurationReadRequest: configurationRead(pesp_conn); break;
            case MT_ConfigurationSaveRequest: configurationSave(msg->body); break;
            case MT_FotaStateReadRequest: fotaStateRead(pesp_conn); break;
            case MT_FotaStartRequest: fotaStart(msg->body); break;
            case MT_FotaWriteRequest: fotaWrite(pesp_conn, msg->body); break;
            case MT_RGBLedRibbonReadStateRequest: ledRibbonReadState(pesp_conn); break;
            case MT_RGBLedRibbonChangeRequest: ledRibbonChange(msg->body); break;
        }

        os_free(msg);
    }
}

// ############################## END TCP