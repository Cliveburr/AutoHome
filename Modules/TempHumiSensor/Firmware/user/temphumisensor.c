#include "user_config.h"
#include "temphumisensor.h"
#include "net.h"

/******************************* CONFIG METHODS *************************************/
ICACHE_FLASH_ATTR
uint8 temphumisensor_make_checksum(void)
{
	return temphumisensor_config.generalConfig +
		temphumisensor_config.tempPointToOff +
		temphumisensor_config.tempPointToOn +
		temphumisensor_config.humiPointToOff +
		temphumisensor_config.humiPointToOn +
		temphumisensor_config.readInverval;
}

ICACHE_FLASH_ATTR
void temphumisensor_config_save(void)
{
    #ifdef DEBUG
        os_printf("temphumisensor_config_save...\n");
    #endif

    temphumisensor_config.checksum = temphumisensor_make_checksum();
    os_printf("checksum = %u\n", temphumisensor_config.checksum);

    spi_flash_erase_sector(TEMPHUMI_CONFIG_SECTOR);
    spi_flash_write(TEMPHUMI_CONFIG_SECTOR * SPI_FLASH_SEC_SIZE, (uint32*)&temphumisensor_config, sizeof(TempHumiSensorStruct));
}

ICACHE_FLASH_ATTR
void temphumisensor_config_load(void)
{
    #ifdef DEBUG
        os_printf("temphumisensor_config_load...\n");
    #endif

    spi_flash_read(TEMPHUMI_CONFIG_SECTOR * SPI_FLASH_SEC_SIZE, (uint32*)&temphumisensor_config, sizeof(TempHumiSensorStruct));

    uint8 checksum = temphumisensor_make_checksum();
    #ifdef DEBUG
        os_printf("checksum = %u, temphumisensor_config.checksum = %u\n", checksum, temphumisensor_config.checksum);
    #endif

    if (temphumisensor_config.checksum != checksum)
    {
        temphumisensor_config.checksum = 0;
		temphumisensor_config.generalConfig = 0;
		temphumisensor_config.tempPointToOff = 0;
		temphumisensor_config.tempPointToOn = 0;
		temphumisensor_config.humiPointToOff = 0;
		temphumisensor_config.humiPointToOn = 0;
		temphumisensor_config.readInverval = 0;
	}
}
/******************************* CONFIG METHODS *************************************/

/******************************* TCP HANDLE METHODS *************************************/
ICACHE_FLASH_ATTR
void temphumisensor_configuration_read(struct espconn* pesp_conn)
{
	#ifdef DEBUG
		os_printf("temphumisensor_configuration_read...\n");
	#endif

	uint8 totalBuffer = 3 + 6;

	uint8* buffer = (uint8*)os_zalloc(totalBuffer);
	uint8 pos = 0;
	buffer[pos++] = config.uid;
	buffer[pos++] = 4;    // temphumisensor port
	buffer[pos++] = 2;    // configuration response

	buffer[pos++] = temphumisensor_config.generalConfig;
	buffer[pos++] = temphumisensor_config.tempPointToOff;
	buffer[pos++] = temphumisensor_config.tempPointToOn;
	buffer[pos++] = temphumisensor_config.humiPointToOff;
	buffer[pos++] = temphumisensor_config.humiPointToOn;
	buffer[pos++] = temphumisensor_config.readInverval;

	espconn_sent(pesp_conn, buffer, totalBuffer);
	os_free(buffer);
}

ICACHE_FLASH_ATTR
void temphumisensor_configuration_save(char* data)
{
	#ifdef DEBUG
		os_printf("temphumisensor_configuration_save...\n");
	#endif

	uint8 pos = 0;

	temphumisensor_config.generalConfig = data[pos++];
	temphumisensor_config.tempPointToOff = data[pos++];
	temphumisensor_config.tempPointToOn = data[pos++];
	temphumisensor_config.humiPointToOff = data[pos++];
	temphumisensor_config.humiPointToOn = data[pos++];
	temphumisensor_config.readInverval = data[pos++];

	temphumisensor_config_save();
}

ICACHE_FLASH_ATTR
void temphumisensor_oneshot_read(struct espconn* pesp_conn)
{
	#ifdef DEBUG
		os_printf("temphumisensor_oneshot_read...\n");
	#endif

	uint8 totalBuffer = 3 + 6;

	uint8* buffer = (uint8*)os_zalloc(totalBuffer);
	uint8 pos = 0;
	buffer[pos++] = config.uid;
	buffer[pos++] = 4;    // temphumisensor port
	buffer[pos++] = 5;    // oneshot response

	buffer[pos++] = temphumisensor_config.generalConfig;
	buffer[pos++] = temphumisensor_config.tempPointToOff;
	buffer[pos++] = temphumisensor_config.tempPointToOn;
	buffer[pos++] = temphumisensor_config.humiPointToOff;
	buffer[pos++] = temphumisensor_config.humiPointToOn;
	buffer[pos++] = temphumisensor_config.readInverval;

	espconn_sent(pesp_conn, buffer, totalBuffer);
	os_free(buffer);
}
/******************************* TCP HANDLE METHODS *************************************/

/******************************* PUBLIC METHODS *************************************/
ICACHE_FLASH_ATTR
void temphumisensor_init(void)
{
	temphumisensor_config_load();

	// adjust the interval and switchs
}

ICACHE_FLASH_ATTR
void temphumisensor_tcp_handle(struct espconn* pesp_conn, char* data)
{
	uint8 msg = data[0];

	switch (msg)
	{
		case 1: temphumisensor_configuration_read(pesp_conn); break;
		case 3: temphumisensor_configuration_save(&data[1]); break;
		case 4: temphumisensor_oneshot_read(pesp_conn); break;
	}
}
/******************************* PUBLIC METHODS *************************************/