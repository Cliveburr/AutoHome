#include "ets_sys.h"
#include "osapi.h"
#include "c_types.h"
#include "user_interface.h"
#include "gpio.h"

#include "dht.h"

// melhor alimentar com 5V
// esperar 1s depois de ligar antes da primeira leitura
// ler com no minimo 2s de intervalo



// mandar o start signal de 1ms low
// gravar os periodos que a linha esteve low ou high


// para configurar a porta
// configurar o mux
// setar para input GPIO_DIS_OUTPUT


void wdt_feed(void); 

uint8_t state;

ICACHE_FLASH_ATTR
void dht_read(dht_module_t *module)
{
	uint8_t periods[84], lowCycles, highCycles;
	uint8_t last_state, pos, i;
	
	// reset the data
	module->data[0] = module->data[1] = module->data[2] = module->data[3] = module->data[4] = 0;
	os_memset(&periods, 0, 84);
 
	// disable interrupts and feed the dog
	ets_intr_lock();
	wdt_feed();
	
	// set the pin to output to wakeup
	GPIO_OUTPUT_SET(GPIO_ID_PIN(module->pin), 1);
	os_delay_us(1000);
	
	// send the start signal
	GPIO_OUTPUT_SET(GPIO_ID_PIN(module->pin), 0);
	os_delay_us(module->start_signal_us);

	// set the pin to input mode
	GPIO_DIS_OUTPUT(GPIO_ID_PIN(module->pin));
	os_delay_us(40);
	
	// read the first data state
	last_state = 1;
	
	for (pos = 0; pos < 84; pos++)
	{
		while (GPIO_INPUT_GET(GPIO_ID_PIN(module->pin)) == last_state && periods[pos] < module->timeout)
		{
			os_delay_us(1);
			periods[pos]++;
		}

		last_state = GPIO_INPUT_GET(GPIO_ID_PIN(module->pin));
	}

	// enable interrupts
	ets_intr_unlock();
	
	for (i = 0; i < 84; i++)
	{
		module->periods[i] = periods[i];
	}


	for (i = 0; i < 40; i++)
	{
		lowCycles  = periods[(i * 2) + 3];
		highCycles = periods[(i * 2) + 4];
		
		module->data[i/8] <<= 1;

		if (highCycles > lowCycles)
		{
			module->data[i/8] |= 1;
		}
	}
	
	module->success = (module->data[4] == ((module->data[0] + module->data[1] +module-> data[2] + module->data[3]) & 0xFF)) ?
		1 : 0;
}

ICACHE_FLASH_ATTR
int16_t dht_data_to_temperature(uint8_t *data)
{
	int16_t temp = data[2] & 0x7F;
	temp = (temp << 8) + data[3];
	if (data[2] & 0x80)
	{
		temp *= -1;
	}
	return temp;
}

ICACHE_FLASH_ATTR
uint16_t dht_data_to_humidity(uint8_t *data)
{
	return (data[0] << 8) + data[1];
}