#include "ets_sys.h"
#include "osapi.h"
#include "user_interface.h"
#include "espconn.h"
#include "mem.h"
#include "auto_home.station.h"
#include "led_ribbon.h"

void set_station_mode(void) {
    struct station_config stationConf;

	wifi_set_opmode_current(STATION_MODE);
	os_memset(&stationConf, 0, sizeof(struct station_config));
	os_sprintf(stationConf.ssid, "Matrix");
	os_sprintf(stationConf.password, "12346666");
	wifi_station_set_config_current(&stationConf);
	wifi_set_event_handler_cb(station_handle_event_cb);
    wifi_station_disconnect();
	wifi_station_connect();
	wifi_set_sleep_type(LIGHT_SLEEP_T); 
}

void station_handle_event_cb(System_Event_t *evt) {
    os_printf("station_handle_event_cb %x\n", evt->event);
    switch (evt->event) {
         case EVENT_STAMODE_GOT_IP:
			 udp_client.type = ESPCONN_UDP;
             udp_client.proto.udp = (esp_udp*)os_zalloc(sizeof(esp_udp));
             udp_client.proto.udp->local_port = RECEIVE_PORT;
			 espconn_regist_recvcb(&udp_client, station_udp_handle_event_cb);
			 espconn_create(&udp_client);

             valid_api_addres();
             break;
         default:
             break;
    }
}

uint8 valid_api_addres(void) {
    if (config.valid_api_address)
        return 1;
    else {

#ifdef DEBUG
	os_printf("not valid api address...\n");
#endif

        send_ping_broadcast();
        return 0;
    }
}

void station_udp_handle_event_cb(void *arg, char *pdata, unsigned short len) {

#ifdef DEBUG
	os_printf("message received...\n");
#endif

    struct MessageBase msg = parseMessage(pdata);

    if (!(msg.receiverUID == 0 || msg.receiverUID == MyUID))
        return;

    switch (msg.type)
    {
        case InfoRequest: sendInfoResponse(msg); break;
        case ApiPong: processPongMessage(msg); break;
        case ModuleMessage: process_module_message(msg); break;
    }
}

struct MessageBase parseMessage(char *data) {
    struct MessageBase msg;

    msg.senderUID = (data[1] << 8) | data[0];
    msg.receiverUID = (data[3] << 8) | data[2];
    msg.type = data[4];
    msg.body = &data[5];

#ifdef DEBUG
    os_printf("parseMessage...\n");
    os_printf("msg.senderUID = %u\n", msg.senderUID);
    os_printf("msg.receiverUID = %u\n", msg.receiverUID);
    os_printf("msg.type = %u\n", msg.type);
#endif

    return msg;
}

void set_message_base(uint8 *msg, uint8 toUID) {
    msg[0] = MyUID;
    msg[1] = MyUID >> 8;
    msg[2] = toUID;
    msg[3] = toUID >> 8;
}

void print_buffer(uint8 *buf, uint8 len) {
    uint8 i = 0;
    os_printf("[");
    for (i = 0; i < len; i++) {
        os_printf("%u", buf[i]);
        if (i < len - 1)
            os_printf(",");
    }
    os_printf("]\n");
}

void send_ping_broadcast(void) {

#ifdef DEBUG
    os_printf("send_ping_broadcast...\n");
#endif

    uint8 buffer[5] = {0};
    set_message_base(buffer, 1);  // UID 1 = Api
    buffer[4] = ApiPing;

    uint8 address[4] = {0};
    struct ip_info ipconfig;
    uint8 *p = (unsigned char*)&ipconfig.ip.addr;
    wifi_get_ip_info(STATION_IF, &ipconfig);
    address[0] = p[0];
    address[1] = p[1];
    address[2] = p[2];
    address[3] = 255;

#ifdef DEBUG
    os_printf("buffer: "); print_buffer(buffer, 5);
    os_printf("address: "); print_buffer(address, 4);
#endif

    os_memcpy(udp_client.proto.udp->remote_ip, address, 4);
    udp_client.proto.udp->remote_port = SEND_PORT;
    espconn_sent(&udp_client, buffer, 5);
}

void sendInfoResponse(struct MessageBase msg) {

#ifdef DEBUG
    os_printf("sendInfoResponse...\n");
#endif

    if (!valid_api_addres())
        return;

    uint8 buffer[6] = {0};
    set_message_base(buffer, msg.senderUID);
    buffer[4] = InfoResponse;

    buffer[5] = 1; // ModuleType.LedRibbonRgb

#ifdef DEBUG
    os_printf("buffer: "); print_buffer(buffer, 6);
#endif

    os_memcpy(udp_client.proto.udp->remote_ip, config.api_address, 4);
    udp_client.proto.udp->remote_port = SEND_PORT;
    espconn_sent(&udp_client, buffer, 6);
}

void processPongMessage(struct MessageBase msg) {

#ifdef DEBUG
    os_printf("processPongMessage...\n");
#endif

    config.valid_api_address = 1;
    os_memcpy(config.api_address, udp_client.proto.udp->remote_ip, 4);
}