#include "user_interface.h"
#include "espconn.h"
#include "osapi.h"
#include "mem.h"
#include "c_types.h"
#include "spi_flash.h"

#include "temphumisensor.h"
#include "dht.h"

typedef struct {
    uint64_t id;
    uint32_t addr;
    uint32_t checksum;
} datainfo_t;

datainfo_t datainfo;
uint16_t datainfo_pos;
uint32_t datainfo_addr;

uint8_t hasPackageInitied;
uint8_t data_package_pos;
data_package_t data_package;

typedef struct {
   uint8_t tempSwtichState : 1;
   uint8_t humiSwtichState : 1;
} switchs_state_t;

dht_module_t moduleOne;
os_timer_t readInterval_timer;
uint8_t isActive;
switchs_state_t swtichStates;

/******************************* DATA INFO METHODS *************************************/
ICACHE_FLASH_ATTR
void temphumisensor_datainfo_load(void)
{
    #ifdef DEBUG
        os_printf("temphumisensor_datainfo_load...\n");
    #endif
	
    uint16_t i;
    uint8_t *infoSector = (uint8_t*)os_zalloc(SPI_FLASH_SEC_SIZE);
    uint32_t sectorIniAddr = TEMPHUMI_DATAINFO_SECTOR * SPI_FLASH_SEC_SIZE;

    spi_flash_read(sectorIniAddr, (uint32*)infoSector, SPI_FLASH_SEC_SIZE);

    datainfo.id = 0;
    datainfo.addr = 0;
    datainfo.checksum = 0;
    datainfo_pos = 0;
    for (i = 0; i < SPI_FLASH_SEC_SIZE; i += 16)
    {
        uint64_t thisId = (infoSector[7] << 24) | (infoSector[6] << 24) | (infoSector[5] << 24) | (infoSector[4] << 24) | (infoSector[3] << 24) | (infoSector[2] << 16) | (infoSector[1] << 8) | infoSector[0];
        uint32_t thisAddr = (infoSector[11] << 24) | (infoSector[10] << 16) | (infoSector[9] << 8) | infoSector[8];
        uint32_t thisChecksum = (infoSector[15] << 24) | (infoSector[14] << 16) | (infoSector[13] << 8) | infoSector[12];

        uint32_t calculedChecksum = thisId + thisAddr;

        if (calculedChecksum == thisChecksum)
        {
            if (thisId > datainfo.id)
            {
                datainfo.id = thisId;
                datainfo.addr = thisAddr;
                datainfo_pos = i;
            }
        }
    }

    os_free(infoSector);
}

ICACHE_FLASH_ATTR
void temphumisensor_datainfo_save(uint32_t addr)
{
    #ifdef DEBUG
        os_printf("temphumisensor_datainfo_save...\n");
    #endif

    datainfo.id++;
    datainfo_pos += 16;
    if (datainfo.id == 0)
    {
        spi_flash_erase_sector(TEMPHUMI_DATAINFO_SECTOR);
        datainfo_pos = 0;
    }

    if ((datainfo_pos + 16) >= SPI_FLASH_SEC_SIZE)
    {
        datainfo_pos = 0;
    }

    datainfo.addr = addr;
    datainfo.checksum = datainfo.id + datainfo.addr;

    uint32_t sectorIniAddr = TEMPHUMI_DATAINFO_SECTOR * SPI_FLASH_SEC_SIZE;

    spi_flash_write(sectorIniAddr + datainfo_pos, (uint32*)&datainfo, sizeof(datainfo_t));
}
/******************************* DATA INFO METHODS *************************************/

/******************************* PACKAGE METHODS *************************************/
ICACHE_FLASH_ATTR
void temphumisensor_createdatapackage(void)
{
    hasPackageInitied = true;
    data_package_pos = 0;

    memset(&data_package, 0, sizeof(data_package_t));
    //data_package.started_timestamp = (uint)DateTimeOffset.Now.ToUnixTimeSeconds();
    data_package.readInterval = temphumisensor_config.readInterval;
}

ICACHE_FLASH_ATTR
void temphumisensor_writedatapackage(void)
{
    #ifdef DEBUG
        os_printf("temphumisensor_writedatapackage...\n");
    #endif

    uint32_t addr = datainfo_addr == 0 ?
        TEMPHUMISENSOR_DATA_SECTOR_INI_ADDR :
        datainfo_addr + TEMPHUMISENSOR_DATA_PACKAGE_LEN;

    if ((addr + TEMPHUMISENSOR_DATA_PACKAGE_LEN) >= (TEMPHUMISENSOR_DATA_SECTOR_END_ADDR))
    {
        addr = TEMPHUMISENSOR_DATA_SECTOR_INI_ADDR;
    }

	uint8_t *buffer = (uint8_t*)os_zalloc(TEMPHUMISENSOR_DATA_PACKAGE_LEN);
	os_memcpy(&buffer[0], &data_package.started_timestamp, 4);
	os_memcpy(&buffer[4], &data_package.readInterval, 2);
	os_memcpy(&buffer[6], data_package.data, 250);

    spi_flash_write(addr, (uint32*)buffer, TEMPHUMISENSOR_DATA_PACKAGE_LEN);
    os_free(buffer);

    temphumisensor_datainfo_save(addr);

    hasPackageInitied = false;
}

ICACHE_FLASH_ATTR
void temphumisensor_data_save(uint8_t *data, uint8_t swtichs)
{
    #ifdef DEBUG
        os_printf("temphumisensor_data_save...\n");
    #endif
	
    if (!hasPackageInitied)
    {
        temphumisensor_createdatapackage();
    }

    uint8_t datapck_addr = data_package_pos * 5;
    os_memcpy(&data_package.data[datapck_addr], data, 4);
    data_package.data[datapck_addr + 4] = swtichs;

    data_package_pos++;

    if (data_package_pos == TEMPHUMISENSOR_DATA_PACKAGE_COUNTS)
    {
        temphumisensor_writedatapackage();
    }
}
/******************************* PACKAGE METHODS *************************************/


/******************************* TIMERS METHODS *************************************/
ICACHE_FLASH_ATTR
void temphumisensor_set_tempswitch(uint8_t state)
{
	swtichStates.tempSwtichState = state;
	GPIO_OUTPUT_SET(GPIO_ID_PIN(TEMPHUMI_TEMPSWITCH_PIN), state);
}

ICACHE_FLASH_ATTR
void temphumisensor_set_humiswitch(uint8_t state)
{
	swtichStates.humiSwtichState = state;
	GPIO_OUTPUT_SET(GPIO_ID_PIN(TEMPHUMI_HUMISWITCH_PIN), state);
}

ICACHE_FLASH_ATTR
void temphumisensor_resetall(void)
{
	isActive = 0;
	temphumisensor_set_tempswitch(0);
	temphumisensor_set_humiswitch(0);
}

ICACHE_FLASH_ATTR
void temphumisensor_set_timers(void)
{
    #ifdef DEBUG
        os_printf("temphumisensor_set_timers...\n");
    #endif

	if (isActive)
	{
		os_timer_disarm(&readInterval_timer);
	}

	if (temphumisensor_config.generalConfig.intervalActive)
	{
		os_timer_arm(&readInterval_timer, temphumisensor_config.readInterval, 1);
		isActive = 1;
	}
	else
	{
		temphumisensor_resetall();
	}
}

void temphumisensor_timer_cb(void)
{
    #ifdef DEBUG
        os_printf("temphumisensor_timer_cb...\n");
    #endif

	dht_read(&moduleOne);

	if (!moduleOne.success)
	{
		#ifdef DEBUG
			os_printf("moduleOne.success = false\n");
		#endif
		return;
	}

	if (temphumisensor_config.generalConfig.temperatureSwitch)
	{
		int16_t temp = dht_data_to_temperature(moduleOne.data);
		
		if (swtichStates.tempSwtichState)
		{
			if (temp < temphumisensor_config.tempPointToOff)
			{
				temphumisensor_set_tempswitch(0);
			}
		}
		else
		{
			if (temp > temphumisensor_config.tempPointToOn)
			{
				temphumisensor_set_tempswitch(1);
			}
		}
	}

	if (temphumisensor_config.generalConfig.humiditySwitch)
	{
		uint16_t humi = dht_data_to_humidity(moduleOne.data);
		
		if (swtichStates.humiSwtichState)
		{
			if (humi > temphumisensor_config.humiPointToOff)
			{
				temphumisensor_set_humiswitch(0);
			}
		}
		else
		{
			if (humi < temphumisensor_config.humiPointToOn)
			{
				temphumisensor_set_humiswitch(1);
			}
		}
	}

	if (temphumisensor_config.generalConfig.saveData)
	{
		uint8_t swtichs = *(uint8_t*)&swtichStates;
		temphumisensor_data_save(moduleOne.data, swtichs);
	}
}
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
	temphumisensor_set_timers();
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

	dht_read(&moduleOne);

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

	uint8_t totalBuffer = 3 + 84;

	uint8_t* buffer = (uint8_t*)os_zalloc(totalBuffer);
	os_memset(buffer, 0, totalBuffer);
	uint8_t pos = 0;
	buffer[pos++] = config.uid;
	buffer[pos++] = 4;    // temphumisensor port
	buffer[pos++] = 7;    // data response

	dht_read(&moduleOne);

    uint8_t i;
	for (i = 0; i < 84; i++)
	{
		buffer[pos + i] = moduleOne.periods[i];
	}

	espconn_sent(pesp_conn, buffer, totalBuffer);
	os_free(buffer);
}

ICACHE_FLASH_ATTR
void temphumisensor_history_read(char* data, struct espconn* pesp_conn)
{
	#ifdef DEBUG
		os_printf("temphumisensor_history_read...\n");
	#endif

	uint8_t skip = data[0];
	uint8_t take = data[1];
	uint8_t moved = 0;
	uint8_t taked = 0;
	uint16_t pos = 0;
	uint8_t* buffer = (uint8_t*)os_zalloc(1460);

	if (hasPackageInitied)
	{
		taked++;

		buffer[pos++] = 1;       // flag to indicate that has unsaved data
		buffer[pos++] = data_package_pos + 1;      // count of data unsaved
		buffer[pos] = data_package.started_timestamp;

		response.UnSavedData = new Protocol.Library.Messages.TempHumiSensor.data_package_t
		{
			started_timestamp = data_package.started_timestamp,
			readInterval = data_package.readInterval,
			data = data_package.data
		};
		response.UnSavedData.data = new byte[data_package_pos * 5];
		Array.Copy(data_package.data, 0, response.UnSavedData.data, 0, response.UnSavedData.data.Length);
	}
	else
	{
		buffer[pos++] = 0;       // flag to indicate that hasn't unsaved data
	}
	

	var datas = new List<Protocol.Library.Messages.TempHumiSensor.data_package_t>();
	var addr = datainfo_addr;
	while ((taked < 4 && taked < take) && (datainfo_addr > 0) && (moved < ushort.MaxValue))
	{
		if (addr < TEMPHUMISENSOR_DATA_SECTOR_INI_ADDR)
		{
			addr = TEMPHUMISENSOR_DATA_SECTOR_END_ADDR;
		}

		if (moved >= skip)
		{
			var buffer = new byte[TEMPHUMISENSOR_DATA_PACKAGE_LEN];
			spi_flash_read(addr, ref buffer, TEMPHUMISENSOR_DATA_PACKAGE_LEN);

			var started_timestamp = BitConverter.ToUInt32(buffer, 0);
			if (started_timestamp == 0)
			{
				break;
			}

			var readInterval = BitConverter.ToUInt16(buffer, 4);
			var data = new byte[250];
			Array.Copy(buffer, 6, data, 0, 250);

			datas.Add(new Protocol.Library.Messages.TempHumiSensor.data_package_t
			{ 
				started_timestamp = started_timestamp,
				readInterval = readInterval,
				data = data
			});
		}

		moved++;
		addr -= TEMPHUMISENSOR_DATA_PACKAGE_LEN;
	}

	espconn_sent(pesp_conn, buffer, ++pos);
	os_free(buffer);
}
/******************************* TCP HANDLE METHODS *************************************/

/******************************* PUBLIC METHODS *************************************/
ICACHE_FLASH_ATTR
void temphumisensor_init(void)
{
 	temphumisensor_config_load();

	moduleOne.pin = TEMPHUMI_DATA_PIN;
	moduleOne.start_signal_us = 3000;
	moduleOne.timeout = 250;

	temphumisensor_datainfo_load();

 	os_timer_setfn(&readInterval_timer, (os_timer_func_t*)temphumisensor_timer_cb, 0);
 	temphumisensor_resetall();
 	temphumisensor_set_timers();
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
		case 8: temphumisensor_history_read(&data[1], pesp_conn); break;
	}
}
/******************************* PUBLIC METHODS *************************************/