#include "user_config.h"
#include "autohome.h"
#include "temphumisensor.h"

/*
	Messages id
	1 = ping
	2 = pong
	3 = configuration request
	4 = configuration response
	5 = configuration save
	6 = set uid
*/

/******************************* PRIVATE METHODS *************************************/

ICACHE_FLASH_ATTR
void ping_pong(struct espconn* espconnv, remot_info* pcon_info, char* data)
{
	if (os_strncmp(data, "PING", 4) != 0) {
		return;
	}

	os_memcpy(espconnv->proto.udp->remote_ip, pcon_info->remote_ip, 4);

	#ifdef DEBUG
		os_printf("send to %d.%d.%d.%d:%d\n",
			espconnv->proto.udp->remote_ip[0],
			espconnv->proto.udp->remote_ip[1],
			espconnv->proto.udp->remote_ip[2],
			espconnv->proto.udp->remote_ip[3],
			espconnv->proto.udp->remote_port);
	#endif

	uint8 aliasLen = os_strlen(config.alias);
	uint8 totalBuffer = 8 + aliasLen;

	uint8* buffer = (uint8*)os_zalloc(totalBuffer);
	buffer[0] = MYUID;
	buffer[1] = 1;    // autohome port
	buffer[2] = 2;    // msg pong
	os_sprintf(&buffer[3], "PONG", 4);

	buffer[7] = MODULE_TYPE;

	buffer[8] = aliasLen;
	os_memcpy(&buffer[8], config.alias, aliasLen);

	espconn_sent(espconnv, buffer, totalBuffer);
	os_free(buffer);
}

ICACHE_FLASH_ATTR
void configuration_read(struct espconn* pesp_conn)
{
	#ifdef DEBUG
		os_printf("configuration_read...\n");
	#endif

	uint8 wifiNameLen = os_strlen(config.net_ssid);
	uint8 wifiPassLen = os_strlen(config.net_password);
	uint8 aliasLen = os_strlen(config.alias);
	uint8 totalBuffer = 3 + 3 + wifiNameLen + wifiPassLen + aliasLen;

	uint8* buffer = (uint8*)os_zalloc(totalBuffer);
	buffer[0] = MYUID;
	buffer[1] = 1;    // autohome port
	buffer[2] = 4;    // configuration response

	uint8 pos = 3;

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
void configuration_save(char* data)
{
	#ifdef DEBUG
		os_printf("configuration_save...\n");
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

	storage_save();
}

void set_uid(char* data)
{
	#ifdef DEBUG
		os_printf("set_uid...\n");
	#endif

	config.uid = data[0];

	storage_save();
}


ICACHE_FLASH_ATTR
void autohome_udp_handler(struct espconn* espconnv, remot_info* pcon_info, char* data)
{
	uint8 msg = data[0];

	switch (msg)
	{
		case 1: ping_pong(espconnv, pcon_info, &data[1]); break;
	}
}

ICACHE_FLASH_ATTR
void autohome_tcp_handler(struct espconn* pesp_conn, char* data)
{
	uint8 msg = data[0];

	switch (msg)
	{
		case 3: configuration_read(pesp_conn); break;
		case 5: configuration_save(&data[1]); break;
		case 6: set_uid(&data[1]); break;
	}
}

/******************************* PUBLIC METHODS *************************************/

ICACHE_FLASH_ATTR
void autohome_init(void)
{
    #ifdef DEBUG
        os_printf("autohome_init...\n");
    #endif

}

ICACHE_FLASH_ATTR
void autohome_udp_recv(struct espconn* espconnv, remot_info* pcon_info, char* data)
{
	uint8 uid = data[0];
	if (uid != MYUID)
	{
		return;
	}

	uint8 port = data[1];
	switch (port) {
		case 1: autohome_udp_handler(espconnv, pesp_conn, &data[2]); break;
	}
}

ICACHE_FLASH_ATTR
void autohome_tcp_recv(struct espconn* pesp_conn, char* data)
{
	uint8_t uid;
	uint8_t port;

	uid = data[0];
	if (uid != MYUID)
	{
		return;
	}

	port = data[1];
	switch (port) {
		case 1: autohome_tcp_handler(pesp_conn, &data[2]); break;
		case 2: fota_tcp_handler(pesp_conn, &data[2]); break;
	}
}