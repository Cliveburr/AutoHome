//#include "eagle_soc.h"
//#include "spi_flash.h"
#include "user_interface.h"
#include "espconn.h"
#include "osapi.h"
#include "mem.h"


// #include "user_config.h"
#include "temphumisensor.h"
#include "dht.h"
// #include "net.h"

typedef struct {
   uint8_t tempSwtichState : 1;
   uint8_t humiSwtichState : 1;
} switchs_state_t;

dht_module_t moduleOne;
os_timer_t readInterval_timer;
uint8_t isActive;
switchs_state_t swtichStates;

// /******************************* TIMERS METHODS *************************************/
// ICACHE_FLASH_ATTR
// void temphumisensor_set_tempswitch(uint8_t state)
// {
// 	swtichStates.tempSwtichState = state;
// 	GPIO_OUTPUT_SET(GPIO_ID_PIN(TEMPHUMI_TEMPSWITCH_PIN), state);
// }

// ICACHE_FLASH_ATTR
// void temphumisensor_set_humiswitch(uint8_t state)
// {
// 	swtichStates.humiSwtichState = state;
// 	GPIO_OUTPUT_SET(GPIO_ID_PIN(TEMPHUMI_HUMISWITCH_PIN), state);
// }

ICACHE_FLASH_ATTR
void temphumisensor_resetall(void)
{
// 	isActive = 0;
// 	temphumisensor_set_tempswitch(0);
// 	temphumisensor_set_humiswitch(0);
}

// ICACHE_FLASH_ATTR
// void temphumisensor_set_timers(void)
// {
//     #ifdef DEBUG
//         os_printf("temphumisensor_set_timers...\n");
//     #endif

// 	if (isActive)
// 	{
// 		os_timer_disarm(&readInterval_timer);
// 	}

// 	if (temphumisensor_config.generalConfig.intervalActive)
// 	{
// 		os_timer_arm(&readInterval_timer, temphumisensor_config.readInterval, 1);
// 		isActive = 1;
// 	}
// 	else
// 	{
// 		temphumisensor_resetall();
// 	}
// }

void temphumisensor_timer_cb(void)
{
    #ifdef DEBUG
        os_printf("temphumisensor_timer_cb...\n");
    #endif

// 	dht_read(&moduleOne);

// 	if (!moduleOne.success)
// 	{
// 		#ifdef DEBUG
// 			os_printf("moduleOne.success = false\n");
// 		#endif
// 		return;
// 	}

// 	if (temphumisensor_config.generalConfig.temperatureSwitch)
// 	{
// 		int16_t temp = dht_data_to_temperature(&moduleOne.data);
		
// 		if (swtichStates.tempSwtichState)
// 		{
// 			if (temp < temphumisensor_config.tempPointToOff)
// 			{
// 				temphumisensor_set_tempswitch(0);
// 			}
// 		}
// 		else
// 		{
// 			if (temp > temphumisensor_config.tempPointToOn)
// 			{
// 				temphumisensor_set_tempswitch(1);
// 			}
// 		}
	}

// 	if (temphumisensor_config.generalConfig.humiditySwitch)
// 	{
// 		uint16_t humi = dht_data_to_humidity(&moduleOne.data);
		
// 		if (swtichStates.humiSwtichState)
// 		{
// 			if (humi > temphumisensor_config.humiPointToOff)
// 			{
// 				temphumisensor_set_humiswitch(0);
// 			}
// 		}
// 		else
// 		{
// 			if (humi < temphumisensor_config.humiPointToOn)
// 			{
// 				temphumisensor_set_humiswitch(1);
// 			}
// 		}
// 	}

// 	// save the data if temphumisensor_general_config_t.saveData is on
// }
// /******************************* TIMERS METHODS *************************************/

/******************************* CONFIG METHODS *************************************/
ICACHE_FLASH_ATTR
uint8_t temphumisensor_make_checksum(void)
{
	uint8_t generalConfig = *(uint8_t*)&temphumisensor_config.generalConfig;

	return generalConfig +
		temphumisensor_config.tempPointToOff +
		temphumisensor_config.tempPointToOn +
		temphumisensor_config.humiPointToOff +
		temphumisensor_config.humiPointToOn +
		temphumisensor_config.readInterval;
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
    spi_flash_write(TEMPHUMI_CONFIG_SECTOR * SPI_FLASH_SEC_SIZE, (uint32*)&temphumisensor_config, sizeof(tempHumisensor_sensor_t));
}

ICACHE_FLASH_ATTR
void temphumisensor_config_load(void)
{
    #ifdef DEBUG
        os_printf("temphumisensor_config_load...\n");
    #endif

    spi_flash_read(TEMPHUMI_CONFIG_SECTOR * SPI_FLASH_SEC_SIZE, (uint32*)&temphumisensor_config, sizeof(tempHumisensor_sensor_t));

    uint8_t checksum = temphumisensor_make_checksum();
    #ifdef DEBUG
        os_printf("checksum = %u, temphumisensor_config.checksum = %u\n", checksum, temphumisensor_config.checksum);
    #endif

    if (temphumisensor_config.checksum != checksum)
    {
		memset(&temphumisensor_config.generalConfig, 0, sizeof(temphumisensor_general_config_t));
        temphumisensor_config.checksum = 0;
		temphumisensor_config.tempPointToOff = 0;
		temphumisensor_config.tempPointToOn = 0;
		temphumisensor_config.humiPointToOff = 0;
		temphumisensor_config.humiPointToOn = 0;
		temphumisensor_config.readInterval = 0;
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

	uint8_t totalBuffer = 3 + (2 * 5) + 1;

	uint8_t *buffer = (uint8_t*)os_zalloc(totalBuffer);
	uint8_t pos = 0;
	buffer[pos++] = config.uid;
	buffer[pos++] = 4;    // temphumisensor port
	buffer[pos++] = 2;    // configuration response

	uint8_t generalConfig = *(uint8_t*)&temphumisensor_config.generalConfig;
	buffer[pos++] = generalConfig;
	buffer[pos++] = temphumisensor_config.tempPointToOff;
	buffer[pos++] = temphumisensor_config.tempPointToOff >> 8;
	buffer[pos++] = temphumisensor_config.tempPointToOn;
	buffer[pos++] = temphumisensor_config.tempPointToOn >> 8;
	buffer[pos++] = temphumisensor_config.humiPointToOff;
	buffer[pos++] = temphumisensor_config.humiPointToOff >> 8;
	buffer[pos++] = temphumisensor_config.humiPointToOn;
	buffer[pos++] = temphumisensor_config.humiPointToOn >> 8;
	buffer[pos++] = temphumisensor_config.readInterval;
	buffer[pos++] = temphumisensor_config.readInterval >> 8;

	espconn_sent(pesp_conn, buffer, totalBuffer);
	os_free(buffer);
}

ICACHE_FLASH_ATTR
void temphumisensor_configuration_save(char* data)
{
	#ifdef DEBUG
		os_printf("temphumisensor_configuration_save...\n");
	#endif

	memset(&temphumisensor_config.generalConfig, data[0], sizeof(temphumisensor_general_config_t));
	temphumisensor_config.tempPointToOff = (data[2] << 8) | data[1];
	temphumisensor_config.tempPointToOn = (data[4] << 8) | data[3];
	temphumisensor_config.humiPointToOff = (data[6] << 8) | data[5];
	temphumisensor_config.humiPointToOn = (data[8] << 8) | data[7];
	temphumisensor_config.readInterval = (data[10] << 8) | data[9];

	temphumisensor_config_save();
	//temphumisensor_set_timers();
}

ICACHE_FLASH_ATTR
void temphumisensor_oneshot_read(struct espconn* pesp_conn)
{
	#ifdef DEBUG
		os_printf("temphumisensor_oneshot_read...\n");
	#endif

	uint8_t totalBuffer = 3 + 1 + 5;

	uint8_t* buffer = (uint8_t*)os_zalloc(totalBuffer);
	os_memset(buffer, 0, totalBuffer);
	uint8_t pos = 0;
	buffer[pos++] = config.uid;
	buffer[pos++] = 4;    // temphumisensor port
	buffer[pos++] = 5;    // oneshot response

	//dht_read(&moduleOne);

	if (moduleOne.success)
	{
		uint8_t swtichStatesValue = *(uint8_t*)&swtichStates;
		buffer[pos++] = swtichStatesValue;

        uint8_t i;
		for (i = 0; i < 5; i++)
		{
			buffer[pos++] = moduleOne.data[i];
		}
	}

	espconn_sent(pesp_conn, buffer, totalBuffer);
	os_free(buffer);
}

ICACHE_FLASH_ATTR
void temphumisensor_data_read(struct espconn* pesp_conn)
{
	#ifdef DEBUG
		os_printf("temphumisensor_data_read...\n");
	#endif

	uint8_t totalBuffer = 3 + 83;

	uint8_t* buffer = (uint8_t*)os_zalloc(totalBuffer);
	os_memset(buffer, 0, totalBuffer);
	uint8_t pos = 0;
	buffer[pos++] = config.uid;
	buffer[pos++] = 4;    // temphumisensor port
	buffer[pos++] = 7;    // data response

	dht_read(&moduleOne);

    uint8_t i;
	for (i = 0; i < 83; i++)
	{
		buffer[pos + i] = moduleOne.periods[i];
	}

	espconn_sent(pesp_conn, buffer, totalBuffer);
	os_free(buffer);
}
/******************************* TCP HANDLE METHODS *************************************/

/******************************* PUBLIC METHODS *************************************/
ICACHE_FLASH_ATTR
void temphumisensor_init(void)
{
 	temphumisensor_config_load();

	moduleOne.pin = TEMPHUMI_DATA_PIN;
	moduleOne.start_signal_us = 20;
	moduleOne.timeout = 200;

 	os_timer_setfn(&readInterval_timer, (os_timer_func_t*)temphumisensor_timer_cb, 0);
 	temphumisensor_resetall();
 	//temphumisensor_set_timers();
}

ICACHE_FLASH_ATTR
void temphumisensor_tcp_handle(struct espconn* pesp_conn, char* data)
{
	uint8_t msg = data[0];

	switch (msg)
	{
		case 1: temphumisensor_configuration_read(pesp_conn); break;
		case 3: temphumisensor_configuration_save(&data[1]); break;
		case 4: temphumisensor_oneshot_read(pesp_conn); break;
        case 6: temphumisensor_data_read(pesp_conn); break;
	}
}
/******************************* PUBLIC METHODS *************************************/