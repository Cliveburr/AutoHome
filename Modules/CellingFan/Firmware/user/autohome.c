#include "osapi.h"
#include "user_interface.h"
#include "mem.h"

#include "user_config.h"
#include "helpers/storage.h"
#include "helpers/array_helpers.h"
#include "fota.h"
#include "autohome.h"
#include "cellingfan.h"

/*
	Messages id
	1 = ping
	2 = pong
	3 = configuration read request
	4 = configuration read response
	5 = configuration save request
	6 = set uid request
*/

/******************************* PRIVATE METHODS *************************************/

ICACHE_FLASH_ATTR
void ping_pong(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("ping_pong...\n");
	#endif

	char* ping = (char*)array_read_bytes(req, 4);
	if (os_strncmp(ping, "PING", 4) != 0) {
		return;
	}
	os_free(ping);

	array_write_uchar(res, 2); // msg pong

	array_write_bytes(res, (uint8_t*)"PONG", 4);

	array_write_uchar(res, MODULE_TYPE);
	
	array_write_string(res, autohome_configuration->alias);
}

ICACHE_FLASH_ATTR
void configuration_read(array_builder_t* req, array_builder_t* res)
{
	uint8_t i;
	#ifdef DEBUG
		os_printf("configuration_read...\n");
	#endif

	array_write_uchar(res, 4); // configuration read response

	array_write_uchar(res, FIRMWARE_VERSION);

	array_write_uchar(res, autohome_configuration->wifiCount);
	for (i = 0; i < autohome_configuration->wifiCount; i++)
	{
		array_write_string(res, autohome_configuration->wifis[i].net_ssid);
		array_write_string(res, autohome_configuration->wifis[i].net_password);
	}

	array_write_string(res, autohome_configuration->alias);
}

ICACHE_FLASH_ATTR
void configuration_save(array_builder_t* req, array_builder_t* res)
{
	uint8_t i;
	#ifdef DEBUG
		os_printf("configuration_save...\n");
	#endif

	autohome_configuration->wifiCount = array_read_uchar(req);
	for (i = 0; i < autohome_configuration->wifiCount; i++)
	{
		os_memset(autohome_configuration->wifis[i].net_ssid, 0, 32);
		array_read_string_to(req, autohome_configuration->wifis[i].net_ssid);

		os_memset(autohome_configuration->wifis[i].net_password, 0, 64);
		array_read_string_to(req, autohome_configuration->wifis[i].net_password);
	}

	os_memset(autohome_configuration->alias, 0, 30);
	array_read_string_to(req, autohome_configuration->alias);

	storage_write("autohome", autohome_configuration);
}

ICACHE_FLASH_ATTR
void set_uid(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("set_uid...\n");
	#endif

	autohome_configuration->uid = array_read_uchar(req);

	storage_write("autohome", autohome_configuration);
}

ICACHE_FLASH_ATTR
void restart(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("system_restart...\n");
	#endif

	system_restart();
}

ICACHE_FLASH_ATTR
void autohome_msg_handler(array_builder_t* req, array_builder_t* res)
{
	uint8 msg = array_read_uchar(req);

	switch (msg)
	{
		case 1: ping_pong(req, res); break;
 		case 3: configuration_read(req, res); break;
 		case 5: configuration_save(req, res); break;
 		case 6: set_uid(req, res); break;
 		case 7: restart(req, res); break;
	}
}

ICACHE_FLASH_ATTR
void autohome_port_handler(array_builder_t* req, array_builder_t* res)
{
	uint8 fromuid = array_read_uchar(req);
	uint8 touid = array_read_uchar(req);

	#ifdef DEBUG
		os_printf("autohome_port_handler from uid: %d, touid: %d ", fromuid, touid);
	#endif
	if (!(touid == autohome_configuration->uid || touid == 0))
	{
		#ifdef DEBUG
			os_printf("not for me!\n");
		#endif
		return;
	}

	array_write_uchar(res, autohome_configuration->uid);
	array_write_uchar(res, fromuid);

	uint8 port = array_read_uchar(req);
	#ifdef DEBUG
		os_printf("port: %d\n", port);
	#endif

	array_write_uchar(res, port);

	switch (port) {
		case 1: autohome_msg_handler(req, res); break;
 		case 2: fota_msg_handler(req, res); break;
 		case 5: cellingfan_msg_handler(req, res); break;
	}
}

ICACHE_FLASH_ATTR
void load_config(void)
{
    autohome_configuration = storage_read("autohome");

	#ifdef DEBUG
		os_printf("autohome_configuration.uid = %d\n", autohome_configuration->uid);
	#endif
}

/******************************* PUBLIC METHODS *************************************/

ICACHE_FLASH_ATTR
void autohome_init(void)
{
    #ifdef DEBUG
        os_printf("autohome_init...\n");
	#endif

	load_config();
}

ICACHE_FLASH_ATTR
void autohome_udp_recv(struct espconn* espconnv, remot_info* pcon_info, char* data, uint16_t len)
{
	array_builder_t req = {0};
	req.bytes = data;
	req.size = len;

	array_builder_t res = {0};

	autohome_port_handler(&req, &res);

	if (res.pos > 3)
	{
		os_memcpy(espconnv->proto.udp->remote_ip, pcon_info->remote_ip, 4);
		espconn_sent(espconnv, res.bytes, res.pos);
	}
	array_free(&res);
}

void autohome_tcp_recv(struct espconn* pesp_conn, char* data, uint16_t len)
{
	array_builder_t req = {0};
	req.bytes = data;
	req.size = len;

	array_builder_t res = {0};

	autohome_port_handler(&req, &res);

	if (res.pos > 3)
	{
		espconn_sent(pesp_conn, res.bytes, res.pos);
	}
	array_free(&res);
}