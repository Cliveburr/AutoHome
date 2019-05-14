#define USE_US_TIMER

#include "osapi.h"
#include "user_interface.h"

#include "user_config.h"
#include "autohome.h"
#include "net.h"
//#include "temphumisensor.h"

static const partition_item_t at_partition_table[] = {
    { SYSTEM_PARTITION_BOOTLOADER, 						0x0, 												0x1000},
    { SYSTEM_PARTITION_OTA_1,   						0x1000, 											0x6A000},
    { SYSTEM_PARTITION_OTA_2,   						0x81000,                     						0x6A000},
    { SYSTEM_PARTITION_RF_CAL,  						0x6B000,                     						0x1000},
    { SYSTEM_PARTITION_PHY_DATA, 						0x6C000,                         					0x1000},
    { SYSTEM_PARTITION_SYSTEM_PARAMETER, 				0x6D000,                                 			0x3000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 0,              0x70000,                                            0x1000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 1,              0x71000,                                            0x1000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 2,              0xEB000,                                            0x315000}
};

void init_done(void);

ICACHE_FLASH_ATTR
void user_pre_init(void)
{
    if(!system_partition_table_regist(at_partition_table, sizeof(at_partition_table)/sizeof(at_partition_table[0]), 6)) {
		os_printf("system_partition_table_regist fail\r\n");
		while(1);
	}
}

ICACHE_FLASH_ATTR
void user_init(void)
{
	system_timer_reinit();

    #ifdef DEBUG
		os_printf("Module Temperature and Humidity Sensor\n");
        os_printf("SDK version: %s\n", system_get_sdk_version());
        //os_printf("Auto Home SA %u.%u - Module UID: %u\n", VERSION_HIGH, VERSION_LOW, MYUID);
    #endif

	system_init_done_cb(init_done);
}

ICACHE_FLASH_ATTR
void init_pins(void)
{
    #ifdef DEBUG
        os_printf("init_pins...\n");
    #endif

    // GPIO 14 - Red Signal
    // redPin.pin = 14;
    // PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTMS_U, FUNC_GPIO14);

    // GPIO 4 - Blue Signal
    // bluePin.pin = 4;
    // PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO4);

    // GPIO 5 - Green Signal
    // greenPin.pin = 5;
    // PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO5);

    // GPIO 13 - Wifi Mode
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTCK_U, FUNC_GPIO13);
    PIN_PULLUP_EN(PERIPHS_IO_MUX_MTCK_U);

    // GPIO 12 - Switch Signal
    // PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO12);
}

ICACHE_FLASH_ATTR
void set_net(void)
{
    uint8 start_mode = GPIO_INPUT_GET(13);

    if (start_mode) {
        net_start_station();
    }
    else {
        net_start_accesspoint();
    }
}

ICACHE_FLASH_ATTR
void init_done(void)
{
    init_pins();

	autohome_init();

    //temphumisensor_init();

    set_net();
}



// /* STA & AP use the same tmpkey to encrypt Simple Pair communication */
// static u8 tmpkey[16] = {0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
// 			0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f};

// #ifdef AS_STA
// /* since the ex_key transfer from AP to STA, so STA's ex_key don't care */
// static u8 ex_key[16] = {0x00};
// #endif /* AS_STA */

// #ifdef AS_AP
// /* since the ex_key transfer from AP to STA, so AP's ex_key must be set */
// static u8 ex_key[16] = {0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0x99, 0x88,
// 			0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11, 0x00};
// #endif /* AS_AP */

// void ICACHE_FLASH_ATTR
// show_key(u8 *buf, u8 len)
// {
// 	u8 i;

// 	for (i = 0; i < len; i++)
// 		os_printf("%02x,%s", buf[i], (i%16 == 15?"\n":" "));
// }

// #ifdef AS_STA
// static void ICACHE_FLASH_ATTR
// scan_done(void *arg, STATUS status)
// {
//     int ret;

//     if (status == OK) {

//         struct bss_info *bss_link = (struct bss_info *)arg;

//         while (bss_link != NULL) {
// 	    if (bss_link->simple_pair) {
//                 os_printf("Simple Pair: bssid %02x:%02x:%02x:%02x:%02x:%02x Ready!\n", 
// 				bss_link->bssid[0], bss_link->bssid[1], bss_link->bssid[2],
// 				bss_link->bssid[3], bss_link->bssid[4], bss_link->bssid[5]);
// 		simple_pair_set_peer_ref(bss_link->bssid, tmpkey, NULL);
// 		ret = simple_pair_sta_start_negotiate();
// 		if (ret)
// 			os_printf("Simple Pair: STA start NEG Failed\n");
// 		else
// 			os_printf("Simple Pair: STA start NEG OK\n");
// 		break;
// 	    }
//             bss_link = bss_link->next.stqe_next;
//         }
//     } else {
//         os_printf("err, scan status %d\n", status);
//     }

// }
// #endif


// void ICACHE_FLASH_ATTR
// sp_status(u8 *sa, u8 status)
// {
// #ifdef AS_STA
// 	switch (status) {
// 	case  SP_ST_STA_FINISH:
// 		simple_pair_get_peer_ref(NULL, NULL, ex_key);
// 		os_printf("Simple Pair: STA FINISH, Ex_key ");
// 		show_key(ex_key, 16);
// 		/* TODO: Try to use the ex-key communicate with AP, for example use ESP-NOW */

// 		/* if test ok , deinit simple pair */
// 		simple_pair_deinit();
// 		break;
// 	case SP_ST_STA_AP_REFUSE_NEG:
// 		/* AP refuse , so try simple pair again  or scan other ap*/
// 		os_printf("Simple Pair: Recv AP Refuse\n");
// 		simple_pair_state_reset();
// 		simple_pair_sta_enter_scan_mode();
// 		wifi_station_scan(NULL, scan_done);
// 		break;
// 	case SP_ST_WAIT_TIMEOUT:
// 		/* In negotiate, timeout , so try simple pair again */
// 		os_printf("Simple Pair: Neg Timeout\n");
// 		simple_pair_state_reset();
// 		simple_pair_sta_enter_scan_mode();
// 		wifi_station_scan(NULL, scan_done);
// 		break;
// 	case SP_ST_SEND_ERROR:
// 		os_printf("Simple Pair: Send Error\n");
// 		/* maybe the simple_pair_set_peer_ref() haven't called, it send to a wrong mac address */

// 		break;
// 	case SP_ST_KEY_INSTALL_ERR:
// 		os_printf("Simple Pair: Key Install Error\n");
// 		/* 1. maybe something argument error.
//  		   2. maybe the key number is full in system*/

// 		/* TODO: Check other modules which use lots of keys 
//                          Example: ESPNOW and STA/AP use lots of keys */
// 		break;
// 	case SP_ST_KEY_OVERLAP_ERR:
// 		os_printf("Simple Pair: Key Overlap Error\n");
// 		/* 1. maybe something argument error.
//  		   2. maybe the MAC Address is already use in ESP-NOW or other module
// 		      the same MAC Address has multi key*/

// 		/* TODO: Check if the same MAC Address used already,
//                          Example: del MAC item of ESPNOW or other module */
// 		break;
// 	case SP_ST_OP_ERROR:
// 		os_printf("Simple Pair: Operation Order Error\n");
// 		/* 1. maybe the function call order has something wrong */

// 		/* TODO: Adjust your function call order */
// 		break;
// 	default:
// 		os_printf("Simple Pair: Unknown Error\n");
// 		break;
// 	}
		
// #endif /* AS_STA */

// #ifdef AS_AP
// 	switch (status) {
// 	case  SP_ST_AP_FINISH:
// 		simple_pair_get_peer_ref(NULL, NULL, ex_key);
// 		os_printf("Simple Pair: AP FINISH\n");

// 		/* TODO: Wait STA use the ex-key communicate with AP, for example use ESP-NOW */
		
// 		/* if test ok , deinit simple pair */
// 		simple_pair_deinit();
// 		break;
// 	case SP_ST_AP_RECV_NEG:
// 		/* AP recv a STA's negotiate request */
// 		os_printf("Simple Pair: Recv STA Negotiate Request\n");

// 		/* set peer must be called, because the simple pair need to know what peer mac is */
// 		simple_pair_set_peer_ref(sa, tmpkey, ex_key);

// 		/* TODO:In this phase, the AP can interaction with Smart Phone,
//                    if the Phone agree, call start_neg or refuse */
// 		simple_pair_ap_start_negotiate();
// 		//simple_pair_ap_refuse_negotiate();
// 		/* TODO:if refuse, maybe call simple_pair_deinit() to ending the simple pair */

// 		break;
// 	case SP_ST_WAIT_TIMEOUT:
// 		/* In negotiate, timeout , so re-enter in to announce mode*/
// 		os_printf("Simple Pair: Neg Timeout\n");
// 		simple_pair_state_reset();
// 		simple_pair_ap_enter_announce_mode();
// 		break;
// 	case SP_ST_SEND_ERROR:
// 		os_printf("Simple Pair: Send Error\n");
// 		/* maybe the simple_pair_set_peer_ref() haven't called, it send to a wrong mac address */

// 		break;
// 	case SP_ST_KEY_INSTALL_ERR:
// 		os_printf("Simple Pair: Key Install Error\n");
// 		/* 1. maybe something argument error.
//  		   2. maybe the key number is full in system*/

// 		/* TODO: Check other modules which use lots of keys 
//                          Example: ESPNOW and STA/AP use lots of keys */
// 		break;
// 	case SP_ST_KEY_OVERLAP_ERR:
// 		os_printf("Simple Pair: Key Overlap Error\n");
// 		/* 1. maybe something argument error.
//  		   2. maybe the MAC Address is already use in ESP-NOW or other module
// 		      the same MAC Address has multi key*/

// 		/* TODO: Check if the same MAC Address used already,
//                          Example: del MAC item of ESPNOW or other module */
// 		break;
// 	case SP_ST_OP_ERROR:
// 		os_printf("Simple Pair: Operation Order Error\n");
// 		/* 1. maybe the function call order has something wrong */

// 		/* TODO: Adjust your function call order */
// 		break;
// 	default:
// 		os_printf("Simple Pair: Unknown Error\n");
// 		break;
// 	}
	
// #endif /* AS_AP */
// }

// void ICACHE_FLASH_ATTR
// init_done(void)
// {
// 	int ret;

// #ifdef AS_STA
// 	wifi_set_opmode(STATION_MODE);

// 	/* init simple pair */
// 	ret = simple_pair_init();
// 	if (ret) {
// 		os_printf("Simple Pair: init error, %d\n", ret);
// 		return;
// 	}
// 	/* register simple pair status callback function */
// 	ret = register_simple_pair_status_cb(sp_status);
// 	if (ret) {
// 		os_printf("Simple Pair: register status cb error, %d\n", ret);
// 		return;
// 	}

// 	os_printf("Simple Pair: STA Enter Scan Mode ...\n");
// 	ret = simple_pair_sta_enter_scan_mode();
// 	if (ret) {
// 		os_printf("Simple Pair: STA Enter Scan Mode Error, %d\n", ret);
// 		return;
// 	}
// 	/* scan ap to searh which ap is ready to simple pair */
// 	os_printf("Simple Pair: STA Scan AP ...\n");
//         wifi_station_scan(NULL,scan_done);
// #endif
// #ifdef AS_AP
// 	wifi_set_opmode(SOFTAP_MODE);

// 	/* init simple pair */
// 	ret = simple_pair_init();
// 	if (ret) {
// 		os_printf("Simple Pair: init error, %d\n", ret);
// 		return;
// 	}
// 	/* register simple pair status callback function */
// 	ret = register_simple_pair_status_cb(sp_status);
// 	if (ret) {
// 		os_printf("Simple Pair: register status cb error, %d\n", ret);
// 		return;
// 	}

// 	os_printf("Simple Pair: AP Enter Announce Mode ...\n");
// 	/* ap must enter announce mode , so the sta can know which ap is ready to simple pair */
// 	ret = simple_pair_ap_enter_announce_mode();
// 	if (ret) {
// 		os_printf("Simple Pair: AP Enter Announce Mode Error, %d\n", ret);
// 		return;
// 	}

// #endif

// }