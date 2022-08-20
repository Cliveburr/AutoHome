
ESP8266

Guide
https://www.espressif.com/sites/default/files/documentation/2a-esp8266-sdk_getting_started_guide_en.pdf

Api Reference
https://www.espressif.com/sites/default/files/documentation/2c-esp8266_non_os_sdk_api_reference_en.pdf
https://www.espressif.com/en/support/download/documents?keys=&field_type_tid%5B%5D=14
https://www.espressif.com/sites/default/files/documentation/esp8266-technical_reference_en.pdf

Tutoriais
http://iot-bits.com/documentation/esp8266-programming-tutorial-documentation/



Modulo de Temperatura e Umidade
DHT11
DHT22 tem melhor range de umidade e precis�o

Datasheet
http://blog.eletrogate.com/wp-content/uploads/2019/01/Datasheet_DHT22_AM2302.pdf
https://cdn-shop.adafruit.com/datasheets/Digital+humidity+and+temperature+sensor+AM2302.pdf


http://casadipucci.blogspot.com/2012/11/camara-de-maturacao_1376.html
http://blog.eletrogate.com/guia-basico-dos-sensores-de-umidade-e-temperatura-dht11-dht22/


C�digo Exemplos

melhor exemplo, parece ter sido inspirado na biblioteca do arduino
https://github.com/mathew-hall/esp8266-dht/blob/master/user/dht.c

biblioteca para o arduino - https://github.com/adafruit/DHT-sensor-library/blob/master/DHT.cpp

ESP01 com Arduino = https://www.fernandok.com/2017/10/blog-post.html

softuart
https://github.com/plieningerweb/esp8266-software-uart/blob/master/softuart/softuart.c

https://github.com/rogerclarkmelbourne/arduino-esp8266/blob/master/esp8266/cores/esp8266/core_esp8266_wiring_digital.c
https://github.com/n0bel/esp8266-UdpTemp/blob/master/driver/ds18b20.c
https://github.com/mathew-hall/esp8266-dht/blob/master/user/ds18b20.c



Basic Memory Map
Start       Hex            Bytes | Start Sector   | Size       Hex            Bytes | Description
            0x0 |              0 |            0x0 |         0x1000 |           4096 | SYSTEM_PARTITION_BOOTLOADER         (boot_v1.2+)
         0x1000 |           4096 |            0x1 |        0x6A000 |         434176 | SYSTEM_PARTITION_OTA_1              (user1.bin)
        0x6B000 |         438272 |           0x6B |        0x96000 |         614400 | unused
       0x101000 |        1052672 |          0x101 |        0x6A000 |         434176 | SYSTEM_PARTITION_OTA_2              (user2.bin)
       0x16B000 |        1486848 |          0x16B |       0x290000 |        2686976 | unused
       0x3FB000 |        4173824 |          0x3FB |         0x1000 |           4096 | SYSTEM_PARTITION_RF_CAL             (blank.bin)
       0x3FC000 |        4177920 |          0x3FC |         0x1000 |           4096 | SYSTEM_PARTITION_PHY_DATA           (esp_init_data_default_v05.bin)
       0x3FD000 |        4182016 |          0x3FD |         0x3000 |          12288 | SYSTEM_PARTITION_SYSTEM_PARAMETER   (0x3FE000 blank.bin)
       0x400000 |        4194304 = 4MB 
#define SYSTEM_PARTITION_OTA_SIZE							0x6A000
#define SYSTEM_PARTITION_OTA_2_ADDR							0x101000
#define SYSTEM_PARTITION_RF_CAL_ADDR						0x3fb000
#define SYSTEM_PARTITION_PHY_DATA_ADDR						0x3fc000
#define SYSTEM_PARTITION_SYSTEM_PARAMETER_ADDR				0x3fd000
static const partition_item_t at_partition_table[] = {
    { SYSTEM_PARTITION_BOOTLOADER, 						0x0, 												0x1000},
    { SYSTEM_PARTITION_OTA_1,   						0x1000, 											SYSTEM_PARTITION_OTA_SIZE},
    { SYSTEM_PARTITION_OTA_2,   						SYSTEM_PARTITION_OTA_2_ADDR, 						SYSTEM_PARTITION_OTA_SIZE},
    { SYSTEM_PARTITION_RF_CAL,  						SYSTEM_PARTITION_RF_CAL_ADDR, 						0x1000},
    { SYSTEM_PARTITION_PHY_DATA, 						SYSTEM_PARTITION_PHY_DATA_ADDR, 					0x1000},
    { SYSTEM_PARTITION_SYSTEM_PARAMETER, 				SYSTEM_PARTITION_SYSTEM_PARAMETER_ADDR, 			0x3000},
};

CellingFan Memory Map 4 = 4096KB(512KB+ 512KB)
Start       Hex            Bytes | Start Sector   | Size       Hex            Bytes | Description
            0x0 |              0 |            0x0 |         0x1000 |           4096 | SYSTEM_PARTITION_BOOTLOADER         (boot_v1.2+)
         0x1000 |           4096 |            0x1 |        0x6A000 |         434176 | SYSTEM_PARTITION_OTA_1              (user1.bin)
        0x6B000 |         438272 |           0x6B |         0x1000 |           4096 | SYSTEM_PARTITION_RF_CAL             (blank.bin)
        0x6C000 |         442368 |           0x6C |         0x1000 |           4096 | SYSTEM_PARTITION_PHY_DATA           (esp_init_data_default_v05.bin)
        0x6D000 |         446464 |           0x6D |         0x3000 |          12288 | SYSTEM_PARTITION_SYSTEM_PARAMETER   (0x6E000 blank.bin)
        0x70000 |         458752 |           0x70 |        0x11000 |          69632 | 68KB FileSystem Part 1
        0x81000 |         528384 |           0x81 |        0x6A000 |         434176 | SYSTEM_PARTITION_OTA_2              (user2.bin)
        0xEB000 |         962560 |           0xEB |       0x315000 |        3231744 | 3,156MB FileSystem Part 2
       0x400000 |        4194304 = 4MB
static const partition_item_t at_partition_table[] = {
    { SYSTEM_PARTITION_BOOTLOADER, 						0x0, 												0x1000},
    { SYSTEM_PARTITION_OTA_1,   						0x1000, 											0x6A000},
    { SYSTEM_PARTITION_OTA_2,   						0x81000,                     						0x6A000},
    { SYSTEM_PARTITION_RF_CAL,  						0x6B000,                     						0x1000},
    { SYSTEM_PARTITION_PHY_DATA, 						0x6C000,                         					0x1000},
    { SYSTEM_PARTITION_SYSTEM_PARAMETER, 				0x6D000,                                 			0x3000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 0,              0x70000,                                            0x11000},
    { SYSTEM_PARTITION_CUSTOMER_BEGIN + 1,              0xEB000,                                            0x315000}
};






uint32 system_get_userbin_addr()
    // Start address info of the current running user binary

uint8 system_get_boot_version()

uint8 system_get_cpu_freq()
    // CPU frequency; unit : MHz

enum system_get_flash_size_map();


uint32 system_get_time()



soft watchdog
system_soft_wdt_stop()
system_soft_wdt_restart()
system_soft_wdt_feed()




pacote de dados da temphumisensor
{
    - para ler a info
    {
        - carrega o sector inteiro

        - faz um loop pelo sector inteiro divido por 8 bytes
            - os 4 primeiros bytes s�o o id
            - os 4 proximos bytes s�o o intervalo de leitura
            - o maior id � o valido
    }

    - salvar a info
    {
        - incrementa o id
        - aumenta a posi��o que foi lido
        - se for menor q 4096 gravar
        - se for maior, gravar na posi��o 0
    }



    - info, guarda apenas a ultima posi��o do pacote gravado uint32

    TEMPHUMI_DATAPCK_LEN = 60     // tamanho dos pacotes em termos de data gravada

    - pacote
        header
            4 bytes da data e hora
            4 bytes para ajustar o tamanho total do pacote a 128
        data
            4 bytes de data
            1 byte de flags dos switchs

    tamanho do pacote = header + (data * TEMPHUMI_DATAPCK_LEN) = 8 + (5 * 60) = 128


Area para dados
Ini: 0xEB000 = 962.560
Fim: 0x400000 = 4.194.304
Len: 3.231.744
Setores: 789

cada pacote guarda 1 hora de informa��o em 128 bytes
3.231.744 / 128 = 25.248 pacotes ou horas

25.248 / 24 = 1.052 dias


100.000 ciclos de vida


}