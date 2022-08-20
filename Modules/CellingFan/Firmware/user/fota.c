#include "c_types.h"
#include "user_interface.h"
#include "espconn.h"
#include "osapi.h"
#include "mem.h"
#include "upgrade.h"

#include "autohome.h"
#include "user_config.h"
#include "fota.h"
#include "net.h"

/*
	Messages id
	1 = fota_state_read request
	2 = fota_state_read response
	3 = fota_start request
	4 = fota_write request
	5 = fota_write response
*/

//#define DEBUG_FOTA

LOCAL char* upgrade_buffer;
LOCAL uint16_t upgrade_buffer_length;
LOCAL uint32_t upgrade_length;
LOCAL uint16_t upgrade_sector;

/******************************* PRIVATE METHODS *************************************/

ICACHE_FLASH_ATTR
void fota_state_read(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("fota_state_read...\n");
	#endif

	array_write_uchar(res, 2); // fota_state_read response

	array_write_uchar(res, system_upgrade_userbin_check());

	array_write_ushort(res, CHUNK_SIZE);
}

ICACHE_FLASH_ATTR
void fota_start(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("fota_start...\n");
	#endif

	upgrade_length = array_read_uint(req);

	upgrade_buffer = (char*)os_zalloc(SPI_FLASH_SEC_SIZE);
	upgrade_buffer_length = 0;

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
	system_upgrade_reboot();
}

ICACHE_FLASH_ATTR
void fota_write(array_builder_t* req, array_builder_t* res)
{
	#ifdef DEBUG
		os_printf("fota_write...\n");
	#endif

	array_write_uchar(res, 5); // fota_write response

	uint16_t length = upgrade_length >= CHUNK_SIZE ?
		CHUNK_SIZE :
		upgrade_length;

	uint16_t tlength = 0;
	uint16_t left = 0;

	if (upgrade_buffer_length + length > SPI_FLASH_SEC_SIZE)
	{
		#ifdef DEBUG_FOTA
			os_printf("sector full\n");
		#endif

		tlength = SPI_FLASH_SEC_SIZE - upgrade_buffer_length;
		left = length - tlength;

		os_memcpy(upgrade_buffer + upgrade_buffer_length, req->bytes + req->pos, tlength);
		upgrade_buffer_length += tlength;
	}
	else
	{
		#ifdef DEBUG_FOTA
			os_printf("sector write\n");
		#endif
		os_memcpy(upgrade_buffer + upgrade_buffer_length, req->bytes + req->pos, length);
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
		#ifdef DEBUG_FOTA
			os_printf("has left %d\n", left);
		#endif
		os_memcpy(upgrade_buffer, req->bytes + req->pos + tlength, left);
		upgrade_buffer_length += left;
	}

	upgrade_length -= length;

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

		array_write_uchar(res, 1);

		system_upgrade_flag_set(UPGRADE_FLAG_FINISH);

		os_timer_t* client_timer = (os_timer_t*)os_zalloc(sizeof(os_timer_t));
		os_timer_disarm(client_timer);
		os_timer_setfn(client_timer, (os_timer_func_t*)fotaReboot, client_timer);
		os_timer_arm(client_timer, 1000, 0);
	}
	else
	{
		array_write_uchar(res, 0);
	}
}

/******************************* PUBLIC METHODS *************************************/

void fota_msg_handler(array_builder_t* req, array_builder_t* res)
{
	uint8 msg = array_read_uchar(req);

	switch (msg)
	{
		case 1: fota_state_read(req, res); break;
		case 3: fota_start(req, res); break;
		case 4: fota_write(req, res); break;
	}
}