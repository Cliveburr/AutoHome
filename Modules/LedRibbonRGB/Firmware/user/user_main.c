#include "driver/uart.h"
#include "ets_sys.h"
#include "osapi.h"
#include "user_interface.h"
#include "espconn.h"
#include "gpio.h"
#include "user_config.h"

#define USE_US_TIMER


uint32 ICACHE_FLASH_ATTR
user_rf_cal_sector_set(void)
{
    enum flash_size_map size_map = system_get_flash_size_map();
    uint32 rf_cal_sec = 0;

    switch (size_map) {
        case FLASH_SIZE_4M_MAP_256_256:
            rf_cal_sec = 128 - 5;
            break;

        case FLASH_SIZE_8M_MAP_512_512:
            rf_cal_sec = 256 - 5;
            break;

        case FLASH_SIZE_16M_MAP_512_512:
        case FLASH_SIZE_16M_MAP_1024_1024:
            rf_cal_sec = 512 - 5;
            break;

        case FLASH_SIZE_32M_MAP_512_512:
        case FLASH_SIZE_32M_MAP_1024_1024:
            rf_cal_sec = 1024 - 5;
            break;

        default:
            rf_cal_sec = 0;
            break;
    }

    return rf_cal_sec;
}



void UdpRecvCb(void *arg, char *pdata, unsigned short len)
{
	os_printf("udp message received:\n");

    struct LanMessage lanMsg = parseLanMessage(pdata);

    if (!(lanMsg.receiverUID == 0 || lanMsg.receiverUID = MyUID)
        return;

    switch (lanMsg.type)
    {
        case InfoRequest: SendInfoRequest(lanMsg); break;
        case ModuleMessage: ProcessModuleMessage(lanMsg); break;
    }

    // uint32_t low = 0;
    // uint32_t high = 0;

    // low = (pdata[3] << 24) | (pdata[2] << 16) | (pdata[1] << 8) | pdata[0];
    // high = (pdata[7] << 24) | (pdata[6] << 16) | (pdata[5] << 8) | pdata[4];
    // redPin.highValue = high;
    // redPin.lowValue = low;

    // low = (pdata[11] << 24) | (pdata[10] << 16) | (pdata[9] << 8) | pdata[8];
    // high = (pdata[15] << 24) | (pdata[14] << 16) | (pdata[13] << 8) | pdata[12];
    // greenPin.highValue = high;
    // greenPin.lowValue = low;

    // low = (pdata[19] << 24) | (pdata[18] << 16) | (pdata[17] << 8) | pdata[16];
    // high = (pdata[23] << 24) | (pdata[22] << 16) | (pdata[21] << 8) | pdata[20];
    // bluePin.highValue = high;
    // bluePin.lowValue = low;

    // set_pinstate(&redPin);
    // set_pinstate(&greenPin);
    // set_pinstate(&bluePin);
}


struct espconn udp_client;
esp_udp udp;


void wifi_handle_event_cb(System_Event_t *evt)
{
    os_printf("event %x\n", evt->event);
	int res;
    switch (evt->event) {
         case EVENT_STAMODE_GOT_IP:
			 udp_client.type=ESPCONN_UDP;
			 udp_client.proto.udp=&udp;
			 udp.local_port = 15555;
			 espconn_regist_recvcb(&udp_client,UdpRecvCb);
			 res = espconn_create(&udp_client);
			 os_printf("%d\n",res);
             break;
         default:
             break;
    }
} 

void user_init(void)
{
    os_printf("SDK version:%s\n", system_get_sdk_version());
    os_printf("Vai Planeta, aaaa");
    struct station_config stationConf;
	wifi_set_opmode_current(STATION_MODE);
	os_memset(&stationConf, 0, sizeof(struct station_config));
	os_sprintf(stationConf.ssid, "Matrix");
	os_sprintf(stationConf.password, "12346666");
	wifi_station_set_config_current(&stationConf);
	wifi_set_event_handler_cb(wifi_handle_event_cb);
    wifi_station_disconnect();
	wifi_station_connect();
	wifi_set_sleep_type(LIGHT_SLEEP_T);  

        //GPIO_OUTPUT_SET(4,1);


    //os_timer_setfn(&blueTimer, (os_timer_func_t*)pin_event, NULL);

}