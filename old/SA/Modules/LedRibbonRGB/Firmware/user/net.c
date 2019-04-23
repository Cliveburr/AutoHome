#include "c_types.h"
#include "user_interface.h"
#include "espconn.h"
#include "osapi.h"
#include "mem.h"
#include "user_config.h"
#include "net.h"
#include "autohome.h"

unsigned char tries_to_connect;

// ############################## UDP

LOCAL ICACHE_FLASH_ATTR
void udp_recv_cb(void *arg, char *data, unsigned short len) {
    #ifdef DEBUG
        os_printf("udp_recv_cb %d...\n", len);
    #endif

    remot_info *pcon_info = NULL;
    espconn_get_connection_info(&udp_espconnv, &pcon_info, 0);

    autohome_udp_recv(pcon_info, data, len);
}

LOCAL ICACHE_FLASH_ATTR
void start_espconnv_udp(void) {
    udp_espconnv.type = ESPCONN_UDP;
    udp_espconnv.proto.udp = (esp_udp*)os_zalloc(sizeof(esp_udp));
    udp_espconnv.proto.udp->local_port = MOD_RECV_PORT;
    udp_espconnv.proto.udp->remote_port = MOD_SEND_PORT;
    espconn_regist_recvcb(&udp_espconnv, udp_recv_cb);
    espconn_create(&udp_espconnv);
}


// ############################## END UDP



// ############################## TCP

LOCAL ICACHE_FLASH_ATTR
void tcp_received(void *arg, char *data, unsigned short len) {
    struct espconn *pesp_conn = arg;

    #ifdef DEBUG
        os_printf("tcp_received: %d...\n", len);
    #endif

    autohome_tcp_recv(pesp_conn, data, len);
}

LOCAL ICACHE_FLASH_ATTR
void tcp_reconnection(void *arg, sint8 err) {
    struct espconn *pesp_conn = arg;

    #ifdef DEBUG
        os_printf("tcp_reconnection %d.%d.%d.%d:%d err %d reconnect\n",
            pesp_conn->proto.tcp->remote_ip[0],
            pesp_conn->proto.tcp->remote_ip[1],
            pesp_conn->proto.tcp->remote_ip[2],
            pesp_conn->proto.tcp->remote_ip[3],
            pesp_conn->proto.tcp->remote_port,
            err);
    #endif
}

LOCAL ICACHE_FLASH_ATTR
void tcp_disconnect(void *arg) {
    struct espconn *pesp_conn = arg;

    #ifdef DEBUG
        os_printf("tcp_disconnect %d.%d.%d.%d:%d disconnect\n",
            pesp_conn->proto.tcp->remote_ip[0],
            pesp_conn->proto.tcp->remote_ip[1],
            pesp_conn->proto.tcp->remote_ip[2],
            pesp_conn->proto.tcp->remote_ip[3],
            pesp_conn->proto.tcp->remote_port);
    #endif
}

LOCAL ICACHE_FLASH_ATTR
void tcp_connection(void *arg) {
    struct espconn *pesp_conn = arg;

    #ifdef DEBUG
        os_printf("tcp_connection %d.%d.%d.%d:%d connect\n",
            pesp_conn->proto.tcp->remote_ip[0],
            pesp_conn->proto.tcp->remote_ip[1],
            pesp_conn->proto.tcp->remote_ip[2],
            pesp_conn->proto.tcp->remote_ip[3],
            pesp_conn->proto.tcp->remote_port);
    #endif

    espconn_regist_recvcb(pesp_conn, tcp_received);
    espconn_regist_reconcb(pesp_conn, tcp_reconnection);
    espconn_regist_disconcb(pesp_conn, tcp_disconnect);
}

ICACHE_FLASH_ATTR
void start_espconnv_tcp(void) {
    tcp_espconnv.type = ESPCONN_TCP;
    tcp_espconnv.state = ESPCONN_NONE;
    tcp_espconnv.proto.tcp = (esp_tcp*)os_zalloc(sizeof(esp_tcp));;
    tcp_espconnv.proto.tcp->local_port = MOD_RECV_PORT;
    espconn_regist_connectcb(&tcp_espconnv, tcp_connection);
    espconn_accept(&tcp_espconnv);
}

// ############################## END TCP




// ############################## NET

LOCAL ICACHE_FLASH_ATTR
void try_reconnect(void) {
    // if (tries_to_connect < 4) {
    //     set_station_mode();
    // }
    // else {
    //     set_accesspoint_mode();
    // }
    set_station_mode();
}

void wifi_event_cb(System_Event_t *evt) {
    // #ifdef DEBUG
    //     os_printf("wifi_event_cb, evt: %x\n", evt->event);
    // #endif
	
    switch (evt->event) {
        case EVENT_STAMODE_GOT_IP:
            #ifdef DEBUG
                os_printf("wifi_event_cb, evt: GOT_IP\n");
            #endif

            tries_to_connect = 0;
			//  udp_client.type = ESPCONN_UDP;
			//  udp_client.proto.udp=&udp;
			//  udp.local_port=8080;
			//  espconn_regist_recvcb(&udp_client,UdpRecvCb);
			//  espconn_create(&udp_client);

            // tcp_conn.type = ESPCONN_TCP;
            // tcp_conn.state = ESPCONN_NONE;
            // tcp_conn.proto.tcp = &esptcp;
            // tcp_conn.proto.tcp->local_port = 15555;
            // espconn_regist_connectcb(&tcp_conn, tcp_connection);
            // espconn_accept(&tcp_conn);
            break;
        case EVENT_STAMODE_DHCP_TIMEOUT:
            #ifdef DEBUG
                os_printf("wifi_event_cb, evt: DHCP_TIMEOUT\n");
            #endif
            try_reconnect();
            break;
        case EVENT_STAMODE_DISCONNECTED:
            #ifdef DEBUG
                os_printf("wifi_event_cb, evt: DISCONNECTED\n");
            #endif
            try_reconnect();
            break;
        case EVENT_SOFTAPMODE_STACONNECTED:
            #ifdef DEBUG
                os_printf("wifi_event_cb, evt: AP CONNECTED\n");
            #endif
            break;
        case EVENT_SOFTAPMODE_STADISCONNECTED:
            #ifdef DEBUG
                os_printf("wifi_event_cb, evt: AP DISCONNECTED\n");
            #endif
            break;
        default:
            break;
    }
}

ICACHE_FLASH_ATTR
void set_accesspoint_mode(void) {

    struct softap_config apconfig;

    #ifdef DEBUG
        os_printf("set_accesspoint_mode...\n");
    #endif

	//wifi_station_disconnect();
	//wifi_station_set_auto_connect(0);

	wifi_set_opmode_current(SOFTAP_MODE);

    wifi_softap_dhcps_stop();
	//wifi_softap_get_config(&apconfig);

    //os_printf("apconfig.ssid: %s\n", apconfig.ssid);
    //os_printf("apconfig.password: %s\n", apconfig.password);

    os_memset(&apconfig, 0, sizeof(struct softap_config));
    //os_memset(config.ssid, 0, 32);
    //os_memset(config.password, 0, 64);
    os_memcpy(apconfig.ssid, "AutoHome Module", 15);
    os_memcpy(apconfig.password, "66666666", 8);

    #ifdef DEBUG
        os_printf("apconfig.ssid: %s\n", apconfig.ssid);
        os_printf("apconfig.password: %s\n", apconfig.password);
    #endif

    apconfig.authmode = AUTH_OPEN; //AUTH_OPEN - AUTH_WEP;
    apconfig.ssid_len = 15;
    apconfig.beacon_interval = 100;
    apconfig.max_connection = 1;

	if (wifi_softap_set_config(&apconfig)) {
	    wifi_set_event_handler_cb(wifi_event_cb);
        wifi_softap_dhcps_start();

        start_espconnv_udp();
        start_espconnv_tcp();
    }
}

ICACHE_FLASH_ATTR
void set_station_mode(void) {

    struct station_config stationConf;

    #ifdef DEBUG
        os_printf("set_station_mode...\n");
    #endif

	wifi_set_opmode_current(STATION_MODE);

	os_memset(&stationConf, 0, sizeof(struct station_config));
    os_memcpy(stationConf.ssid, config.net_ssid, os_strlen(config.net_ssid));
    os_memcpy(stationConf.password, config.net_password, os_strlen(config.net_password));

    #ifdef DEBUG
        os_printf("stationConf.ssid: %s\n", stationConf.ssid);
        os_printf("stationConf.password: %s\n", stationConf.password);
    #endif

	if (wifi_station_set_config_current(&stationConf)) {
        wifi_set_event_handler_cb(wifi_event_cb);
        wifi_station_disconnect();
        wifi_station_connect();
        wifi_set_sleep_type(LIGHT_SLEEP_T);

        start_espconnv_udp();
        start_espconnv_tcp();
    }
}

ICACHE_FLASH_ATTR
void stop_all(void) {
    wifi_softap_dhcps_stop();
    wifi_station_disconnect();
}

// ############################## END NET