#include "user_config.h"
#include "temphumisensor.h"
#include "net.h"

/******************************* PRIVATE METHODS *************************************/

ICACHE_FLASH_ATTR
void define_pins(void)
{
	// GPIO 13 - Wifi Mode
	PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTCK_U, FUNC_GPIO13);
	PIN_PULLUP_EN(PERIPHS_IO_MUX_MTCK_U);
}

ICACHE_FLASH_ATTR
void start_communication(void)
{
	uint8_t start_mode = GPIO_INPUT_GET(13);

	if (start_mode)
	{
		net_start_station();
	}
	else
	{
		net_start_accesspoint();
	}
}


/******************************* PUBLIC METHODS *************************************/

ICACHE_FLASH_ATTR
void temphumisensor_init(void)
{
	define_pins();

	start_communication();

	// start the reading module
}

void temphumisensor_tcp_handle(void)
{

}