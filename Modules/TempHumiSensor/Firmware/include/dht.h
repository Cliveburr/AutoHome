#ifndef __DHT_H__
#define __DHT_H__

#include "c_types.h"

typedef struct {
    uint8_t success;
	uint8_t data[5];
	uint8_t pin;
	uint16_t start_signal_us;
	uint16_t timeout;
	uint16_t periods[83];
} dht_module_t;

void dht_read(dht_module_t *module);
int16_t dht_data_to_temperature(uint8_t *data);
uint16_t dht_data_to_humidity(uint8_t *data);

#endif