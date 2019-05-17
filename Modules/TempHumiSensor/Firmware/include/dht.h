#ifndef __DHT_H__
#define __DHT_H__

typedef struct dht_module_t {
    uint8 success;
	uint8 data[5];
	uint8 pin;
	uint16 start_signal_us;
	uint16 timeout;
};

void dht_read(dht_module_t *module);
int16_t dht_data_to_temperature(uint8_t *data);
uint16_t dht_data_to_humidity(uint8_t *data);

#endif