#ifndef __TEMPHUMISENSOR_H__
#define __TEMPHUMISENSOR_H__

/* *** Config section ***
    To use the Temperature-Humidity-Sensor, must define this in user_config.h

/* *** temphumisensor.h config *** *
#define TEMPHUMI_CONFIG_SECTOR	    0x3C
#define TEMPHUMI_DATA_PIN		    0x3C
#define TEMPHUMI_TEMPSWITCH_PIN		3
#define TEMPHUMI_HUMISWITCH_PIN		3
/* *** end temphumisensor.h config *** *

*/

typedef struct {
   uint8_t intervalActive : 1;
   uint8_t temperatureSwitch : 1;
   uint8_t humiditySwitch : 1;
} temphumisensor_general_config_t;

typedef struct {
    uint8_t checksum;
    temphumisensor_general_config_t generalConfig;
    int16_t tempPointToOff;
    int16_t tempPointToOn;
    uint16_t humiPointToOff;
    uint16_t humiPointToOn;
    uint16_t readInterval;
} tempHumisensor_sensor_t;

tempHumisensor_sensor_t temphumisensor_config;

void temphumisensor_init(void);
void temphumisensor_tcp_handle(struct espconn *pesp_conn, char *data);

#endif