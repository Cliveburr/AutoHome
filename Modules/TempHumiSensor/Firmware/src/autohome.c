

ICACHE_FLASH_ATTR
void configure_gpio(void)
{
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTCK_U, FUNC_GPIO13);
    PIN_PULLUP_EN(PERIPHS_IO_MUX_MTCK_U);
}


ICACHE_FLASH_ATTR
void autohome_init(void)
{
    #ifdef DEBUG
        os_printf("void autohome_init(void)\n");
    #endif

    if (GPIO_INPUT_GET(13)) {
        set_station_mode();
    }
    else {
        set_accesspoint_mode();
    }    
}