#include <stdlib.h>
#include "c_types.h"
#include "user_interface.h"
#include "espconn.h"
#include "osapi.h"
#include "mem.h"

#include "user_config.h"
#include "net.h"
#include "autohome.h"

struct espconn udp_espconnv;
struct espconn tcp_espconnv;

/*
	tentar conectar
		se n conseguir, sobe modo de recuperação
		sobe softap e tenta conectar a cada minuto, se conseguir desconecta e remove modo de recuperação

*/

/******************************* PRIVATE METHODS *************************************/

// ############################## UDP/TCP
LOCAL ICACHE_FLASH_ATTR
void udp_recv_cb(void* arg, char* data, unsigned short len)
{
	#ifdef DEBUG
		os_printf("udp_recv_cb: %d...\n", len);
	#endif

	remot_info* pcon_info = NULL;
	espconn_get_connection_info(&udp_espconnv, &pcon_info, 0);

	autohome_udp_recv(&udp_espconnv, pcon_info, data, len);
}

LOCAL ICACHE_FLASH_ATTR
void tcp_received(void* arg, char* data, unsigned short len)
{
	struct espconn* pesp_conn = arg;

	#ifdef DEBUG
		os_printf("tcp_received: %d...\n", len);
	#endif

	autohome_tcp_recv(pesp_conn, data, len);
}

LOCAL ICACHE_FLASH_ATTR
void tcp_connection(void* arg)
{
	struct espconn* pesp_conn = arg;

	#ifdef DEBUG
		os_printf("tcp_connection %d.%d.%d.%d:%d connect\n",
			pesp_conn->proto.tcp->remote_ip[0],
			pesp_conn->proto.tcp->remote_ip[1],
			pesp_conn->proto.tcp->remote_ip[2],
			pesp_conn->proto.tcp->remote_ip[3],
			pesp_conn->proto.tcp->remote_port);
	#endif

	espconn_regist_recvcb(pesp_conn, tcp_received);
}

LOCAL ICACHE_FLASH_ATTR
void start_espconnv_udp_tcp(void)
{
	udp_espconnv.type = ESPCONN_UDP;
	udp_espconnv.proto.udp = (esp_udp*)os_zalloc(sizeof(esp_udp));
	udp_espconnv.proto.udp->local_port = MOD_RECV_PORT;
	udp_espconnv.proto.udp->remote_port = MOD_SEND_PORT;
	espconn_regist_recvcb(&udp_espconnv, udp_recv_cb);
	espconn_create(&udp_espconnv);

	tcp_espconnv.type = ESPCONN_TCP;
	tcp_espconnv.state = ESPCONN_NONE;
	tcp_espconnv.proto.tcp = (esp_tcp*)os_zalloc(sizeof(esp_tcp));;
	tcp_espconnv.proto.tcp->local_port = MOD_RECV_PORT;
	espconn_regist_connectcb(&tcp_espconnv, tcp_connection);
	espconn_accept(&tcp_espconnv);
}
// ############################## END UDP

// ############################## NET

void net_scan_result(void *arg, STATUS status);
LOCAL ICACHE_FLASH_ATTR void wifi_event_cb(System_Event_t* evt);
os_timer_t* scan_schedule_timer = NULL;

ICACHE_FLASH_ATTR
void test_start_station_in_recovery(void)
{
	struct station_config stationConf;

	#ifdef DEBUG
		os_printf("test_start_station_in_recovery...\n");
	#endif

	os_memset(&stationConf, 0, sizeof(struct station_config));
	os_memcpy(stationConf.ssid, autohome_configuration->net_ssid, os_strlen(autohome_configuration->net_ssid));
	os_memcpy(stationConf.password, autohome_configuration->net_password, os_strlen(autohome_configuration->net_password));

	#ifdef DEBUG
		os_printf("stationConf.ssid: %s\n", stationConf.ssid);
		os_printf("stationConf.password: %s\n", stationConf.password);
	#endif

	if (wifi_station_set_config_current(&stationConf))
	{
		wifi_station_disconnect();
		wifi_station_connect();
	}
}

ICACHE_FLASH_ATTR
void scan_schedule_timer_cb(void)
{
    #ifdef DEBUG
        os_printf("Starting WIFI scan...\n");
    #endif

    os_timer_disarm(scan_schedule_timer);
    os_free(scan_schedule_timer);
	scan_schedule_timer = NULL;
    wifi_station_scan(NULL, net_scan_result);
}

ICACHE_FLASH_ATTR
void set_schedule_timer(void)
{
	if (scan_schedule_timer == NULL)
	{
		scan_schedule_timer = (os_timer_t*)os_zalloc(sizeof(os_timer_t));
		os_timer_setfn(scan_schedule_timer, (os_timer_func_t*)scan_schedule_timer_cb, NULL);
		os_timer_arm(scan_schedule_timer, 60000, 1);
	}
}

ICACHE_FLASH_ATTR
void net_scan_result(void *arg, STATUS status)
{
    if (status == OK)
    {
        struct bss_info *bss_link = (struct bss_info*)arg;

        while (bss_link != NULL)
        {
            #ifdef DEBUG
                os_printf("Wifi scan: %s\n", bss_link->ssid);
            #endif

            if (strcmp(bss_link->ssid, autohome_configuration->net_ssid) == 0)
            {
                test_start_station_in_recovery();
                return;
            }

            bss_link = bss_link->next.stqe_next;
        }
    }

    #ifdef DEBUG
        os_printf("Scan Schedule timer setting...\n");
    #endif
    
    set_schedule_timer();
}

LOCAL ICACHE_FLASH_ATTR
void wifi_recovery_event_cb(System_Event_t* evt)
{
	switch (evt->event) {
		case EVENT_STAMODE_GOT_IP:
			#ifdef DEBUG
				os_printf("wifi_recovery_event_cb, evt: GOT_IP\n");
			#endif
			net_stop_all();
			net_start_station();
			break;
		case EVENT_STAMODE_DISCONNECTED:
			#ifdef DEBUG
				os_printf("wifi_recovery_event_cb, evt: DISCONNECTED\n");
			#endif
    		set_schedule_timer();
			break;
	}
}

LOCAL ICACHE_FLASH_ATTR
void start_recovery_mode(void)
{
	struct softap_config apconfig;

	#ifdef DEBUG
		os_printf("start_recovery_mode...\n");
	#endif

    net_stop_all();

    wifi_set_opmode(STATIONAP_MODE);
	wifi_softap_dhcps_stop();

	os_memset(&apconfig, 0, sizeof(struct softap_config));
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

	if (wifi_softap_set_config(&apconfig))
	{
		wifi_set_event_handler_cb(wifi_recovery_event_cb);
		wifi_softap_dhcps_start();

		start_espconnv_udp_tcp();
	}    
    
	set_schedule_timer();
}

LOCAL ICACHE_FLASH_ATTR
void wifi_event_cb(System_Event_t* evt)
{
	switch (evt->event) {
		case EVENT_STAMODE_CONNECTED:
			#ifdef DEBUG
				os_printf("wifi_event_cb, evt: EVENT_STAMODE_CONNECTED\n");
			#endif
			break;
		case EVENT_STAMODE_GOT_IP:
			#ifdef DEBUG
				os_printf("wifi_event_cb, evt: GOT_IP\n");
			#endif
		    start_espconnv_udp_tcp();
			break;
		case EVENT_STAMODE_DHCP_TIMEOUT:
			#ifdef DEBUG
				os_printf("wifi_event_cb, evt: DHCP_TIMEOUT\n");
			#endif
			start_recovery_mode();
			break;
		case EVENT_STAMODE_DISCONNECTED:
			#ifdef DEBUG
				os_printf("wifi_event_cb, evt: DISCONNECTED\n");
			#endif
			start_recovery_mode();
			break;
		default:
			break;
	}
}

/******************************* PUBLIC METHODS *************************************/

ICACHE_FLASH_ATTR
void net_init(void)
{
	#ifdef DEBUG
		os_printf("net_init...\n");
	#endif

	//start_espconnv_udp_tcp();
    net_stop_all();
    net_start_station();
}

ICACHE_FLASH_ATTR
void net_start_accesspoint(void)
{
	struct softap_config apconfig;

	#ifdef DEBUG
		os_printf("net_start_accesspoint...\n");
	#endif

	wifi_set_opmode_current(SOFTAP_MODE);
	wifi_softap_dhcps_stop();

	os_memset(&apconfig, 0, sizeof(struct softap_config));
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

	if (wifi_softap_set_config(&apconfig))
	{
		wifi_set_event_handler_cb(wifi_event_cb);
		wifi_softap_dhcps_start();

		start_espconnv_udp_tcp();
	}
}

ICACHE_FLASH_ATTR
void net_start_station(void)
{
	struct station_config stationConf;

	#ifdef DEBUG
		os_printf("net_start_station...\n");
	#endif

	wifi_set_opmode_current(STATION_MODE);

	os_memset(&stationConf, 0, sizeof(struct station_config));
	os_memcpy(stationConf.ssid, autohome_configuration->net_ssid, os_strlen(autohome_configuration->net_ssid));
	os_memcpy(stationConf.password, autohome_configuration->net_password, os_strlen(autohome_configuration->net_password));

	#ifdef DEBUG
		os_printf("stationConf.ssid: %s\n", stationConf.ssid);
		os_printf("stationConf.password: %s\n", stationConf.password);
	#endif

	if (wifi_station_set_config_current(&stationConf))
	{
		wifi_set_event_handler_cb(wifi_event_cb);
		wifi_station_disconnect();
		wifi_station_set_reconnect_policy(0);
		wifi_station_set_auto_connect(0);
		wifi_station_connect();
		wifi_set_sleep_type(LIGHT_SLEEP_T);
	}
}

ICACHE_FLASH_ATTR
void net_stop_all(void)
{
	#ifdef DEBUG
		os_printf("net_stop_all...\n");
	#endif

	wifi_set_event_handler_cb(NULL);
	wifi_softap_dhcps_stop();
	wifi_station_disconnect();
}
