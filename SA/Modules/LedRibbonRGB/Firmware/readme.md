##SDK Version: esp8266_nonos_sdk_v2.0.0_16_07_19
##Platform: ESP-LAUNCHER BOARD

##Purpose:
Test ESP8266 chip current under light sleep mode by automatically sleep. And test wifi communication under automatically light sleep.

##Procedure:
1.Please configure the ssid and the password of the AP you want to connect to in user_main.c.

	os_sprintf(stationConf.ssid, "TP-LINK-FD");
	os_sprintf(stationConf.password, "aaaaaaaa");

2.Copy the examples next to bin/ folder in the SDK folder. THe SDK folder should have folders inside it like : bin, examples, third party...Enter example folder, select the example you want to , run ./gen_misc.sh, and follow the tips and steps.

3.Select 1,1,2,0,2 during compiling step 1 to 5. Then bin files will generate in BIN_PATH folder which is bin/upgrade.

4.Download bin files to ESP-LAUNCHER as below sittings.

	Download address of each bin files
	blank.bin						0xFE000
	esp_init_data_default.bin		0xFC000
	boot_v1.6.bin					0x00000
	user1.2048.new.2.bin			0x01000
	
	Flash download tool settings.
	CrystalFreq: 26M
	SPI SPEED: 40MHz
	SPID MODE: QIO
	FLASH SIZE: 8Mbit

##Result:
1.When the board sleep in light-mode, it can keep connected to AP, send message and receive messages.

2.The current would be about 8 mA when the board is sleeping and it would be about 60 mA when the board wake up.

3.Send and receive message. In this example, we create a UDP server after the board wakeup and you can check the received information by serial.

##Uart0 log:

	 