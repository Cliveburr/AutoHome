#ifndef __TEMPHUMISENSOR_H__
#define __TEMPHUMISENSOR_H__

/* *** Config section ***
    To use the Temperature-Humidity-Sensor, must define this in user_config.h

/* *** temphumisensor.h config *** *
#define TEMPHUMI_CONFIG_SECTOR	    0x3C
#define TEMPHUMI_DATA_PIN		    0x3C
#define TEMPHUMI_TEMPSWITCH_PIN		3
#define TEMPHUMI_HUMISWITCH_PIN		3

typedef struct GeneralConfigStruct {
   unsigned char intervalActive : 1;
   unsigned char temperatureSwitch : 1;
   unsigned char humiditySwitch : 1;
} status2;

typedef struct TempHumiSensorStruct {
    uint8 checksum;
    GeneralConfigStruct generalConfig;
    uint8 tempPointToOff;
    uint8 tempPointToOn;
    uint8 humiPointToOff;
    uint8 humiPointToOn;
    uint8 readInverval;
} temphumisensor_config;
/* *** end temphumisensor.h config *** *

*/

void temphumisensor_init(void);
void temphumisensor_tcp_handle(struct espconn* pesp_conn, char* data);

#endif