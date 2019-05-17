

// melhor alimentar com 5V
// esperar 1s depois de ligar antes da primeira leitura
// ler com no minimo 2s de intervalo



// mandar o start signal de 1ms low
// gravar os periodos que a linha esteve low ou high


// para configurar a porta
// configurar o mux
// setar para input GPIO_DIS_OUTPUT




ICACHE_FLASH_ATTR
void dht_read(dht_module_t *module)
{
	uint16 periods[83];
	uint8 init_state, last_state, pos;
	
	// reset the data
	module->data[0] = module->data[1] = module->data[2] = module->data[3] = module->data[4] = 0;
 
	// disable interrupts and feed the dog
	os_intr_lock();
	wdt_feed();
	
	// set the pin to output
	GPIO_OUTPUT_SET(GPIO_ID_PIN(module->pin), 1);
	delay_ms(1);
	
	// send the start signal
	GPIO_OUTPUT_SET(GPIO_ID_PIN(module->pin), 0);
	os_delay_us(module->start_signal_us);
	
	// set the pin to input mode
	GPIO_DIS_OUTPUT(module->pin);
	
	// read the first data state
	init_state = GPIO_INPUT_GET(GPIO_ID_PIN(module->pin));
	last_state = init_state;
	
	for (pos = 0; pos < 83; pos++)
	{
		periods[pos] = 0;

		while (GPIO_INPUT_GET(GPIO_ID_PIN(module->pin)) == last_state)
		{
			os_delay_us(1);
			periods[pos]++;
			if (periods[pos] == module.timeout)
			{
				break;
			}
		}

		if (periods[pos] == module.timeout)
		{
			break;
		}
		else
		{
			last_state ^= 1;
		}
	}

	// enable interrupts
	os_intr_unlock();
	
	if (pos < 83)
	{
		module.success = 0;
	}
	else
	{
		for (int i = 0; i < 40; ++i)
		{
			uint8 period_i = i + 3;
			uint32 lowCycles  = periods[period_i * 2];
			uint32 highCycles = periods[(period_i * 2) + 1];
			
			data[i/8] <<= 1;

			if (highCycles > lowCycles)
			{
				data[i/8] |= 1;
			}
		}
		
		module.success = (data[4] == ((data[0] + data[1] + data[2] + data[3]) & 0xFF) ?
			1 : 0;
	}
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