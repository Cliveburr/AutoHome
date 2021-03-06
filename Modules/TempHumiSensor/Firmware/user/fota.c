#include "c_types.h"
#include "user_interface.h"
#include "espconn.h"
#include "osapi.h"
#include "mem.h"
#include "upgrade.h"

#include "user_config.h"
#include "fota.h"
#include "net.h"

/*
	Messages id
	1 = fota_state_read request
	2 = fota_state_read response
	3 = fota_start
	4 = fota_write request
	5 = fota_write response
*/

LOCAL char* upgrade_buffer;
LOCAL uint16 upgrade_buffer_length;
LOCAL uint32 upgrade_length;
LOCAL uint16 upgrade_sector;
LOCAL os_timer_t client_timer;

/******************************* PRIVATE METHODS *************************************/

ICACHE_FLASH_ATTR
void fota_state_read(struct espconn* pesp_conn)
{
	#ifdef DEBUG
		os_printf("fota_state_read...\n");
	#endif

	unsigned char* buffer = (unsigned char*)os_zalloc(6);
	buffer[0] = config.uid;
	buffer[1] = 2;    // fota port
	buffer[2] = 2;    // fota_state_read response

	buffer[3] = system_upgrade_userbin_check();
	uint16 chunkSize = CHUNK_SIZE;
	buffer[4] = chunkSize;
	buffer[5] = chunkSize >> 8;

	espconn_sent(pesp_conn, buffer, 6);
	os_free(buffer);
}

ICACHE_FLASH_ATTR
void fota_start(char* data)
{
	#ifdef DEBUG
		os_printf("fota_start...\n");
	#endif

	upgrade_buffer = (char*)os_zalloc(SPI_FLASH_SEC_SIZE);
	upgrade_buffer_length = 0;

	upgrade_length = (data[3] << 24) | (data[2] << 16) | (data[1] << 8) | data[0];

	if (system_upgrade_userbin_check() == USER_BIN2) {
		upgrade_sector = USER1_SECTOR;
	}
	else {
		upgrade_sector = USER2_SECTOR;
	}

	#ifdef DEBUG
		os_printf("upgrade_sector: %u\n", upgrade_sector);
		os_printf("upgrade_length: %u\n", upgrade_length);
	#endif

	system_upgrade_flag_set(UPGRADE_FLAG_START);
}

ICACHE_FLASH_ATTR
void fotaReboot(void) {
	net_stop_all();
	//ledRibbon_set_off();
	system_upgrade_reboot();
}

ICACHE_FLASH_ATTR
void fota_write(struct espconn* pesp_conn, char* data)
{
	#ifdef DEBUG
		os_printf("fota_write...\n");
	#endif

	uint16 length = upgrade_length >= CHUNK_SIZE ?
		CHUNK_SIZE :
		upgrade_length;

	uint16 tlength = 0;
	uint16 left = 0;

	if (upgrade_buffer_length + length > SPI_FLASH_SEC_SIZE)
	{
		tlength = SPI_FLASH_SEC_SIZE - upgrade_buffer_length;
		left = length - tlength;

		os_memcpy(upgrade_buffer + upgrade_buffer_length, data, tlength);
		upgrade_buffer_length += tlength;
	}
	else
	{
		os_memcpy(upgrade_buffer + upgrade_buffer_length, data, length);
		upgrade_buffer_length += length;
	}

	if (upgrade_buffer_length == SPI_FLASH_SEC_SIZE)
	{
		#ifdef DEBUG
			os_printf("fotaWrite sector: %u bytes for %u sector\n", upgrade_buffer_length, upgrade_sector);
		#endif

		spi_flash_erase_sector(upgrade_sector);
		spi_flash_write(upgrade_sector * SPI_FLASH_SEC_SIZE, (uint32*)upgrade_buffer, SPI_FLASH_SEC_SIZE);

		upgrade_sector++;
		os_memset(upgrade_buffer, 0, SPI_FLASH_SEC_SIZE);
		upgrade_buffer_length = 0;
	}

	if (left > 0)
	{
		os_memcpy(upgrade_buffer, data + tlength, left);
		upgrade_buffer_length += left;
	}

	upgrade_length -= length;
	unsigned char* responseBuffer = (unsigned char*)os_zalloc(4);
	responseBuffer[0] = config.uid;
	responseBuffer[1] = 2;    // fota port
	responseBuffer[2] = 5;    // fota_write response

	if (upgrade_length == 0)
	{
		if (upgrade_buffer_length > 0)
		{
			#ifdef DEBUG
				os_printf("fotaWrite sector end: %u bytes for %u sector\n", upgrade_buffer_length, upgrade_sector);
			#endif

			spi_flash_erase_sector(upgrade_sector);
			spi_flash_write(upgrade_sector * SPI_FLASH_SEC_SIZE, (uint32*)upgrade_buffer, SPI_FLASH_SEC_SIZE);
		}

		responseBuffer[3] = 1;
		espconn_sent(pesp_conn, responseBuffer, 4);

		system_upgrade_flag_set(UPGRADE_FLAG_FINISH);

		os_timer_disarm(&client_timer);
		os_timer_setfn(&client_timer, (os_timer_func_t*)fotaReboot, NULL);
		os_timer_arm(&client_timer, 1000, 0);
	}
	else
	{
		responseBuffer[3] = 0;
		espconn_sent(pesp_conn, responseBuffer, 4);
	}
	os_free(responseBuffer);
}




/******************************* PUBLIC METHODS *************************************/

void fota_tcp_handler(struct espconn* pesp_conn, char* data)
{
	uint8 msg = data[0];

	switch (msg)
	{
		case 1: fota_state_read(pesp_conn); break;
		case 3: fota_start(&data[1]); break;
		case 4: fota_write(pesp_conn, &data[1]); break;
	}
}