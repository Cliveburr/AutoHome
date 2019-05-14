



Memory
Start       Hex |          Bytes | Start Sector   | Size           |          Bytes | Description
            0x0 |              0 |            0x0 |         0x1000 |           4096 | SYSTEM_PARTITION_BOOTLOADER
         0x1000 |           4096 |            0x1 |        0x6A000 |         434176 | SYSTEM_PARTITION_OTA_1
        0x6B000 |         438272 |           0x6B |        0x96000 |         614400 | empty
       0x101000 |        1052672 |          0x101 |        0x6A000 |         434176 | SYSTEM_PARTITION_OTA_2
       0x16B000 |        1486848 |          0x16B |       0x290000 |        2686976 | empty
       0x3FB000 |        4173824 |          0x3FB |         0x1000 |           4096 | SYSTEM_PARTITION_RF_CAL
       0x3FC000 |        4177920 |          0x3FC |         0x1000 |           4096 | SYSTEM_PARTITION_PHY_DATA  (esp_init_data_default_v05.bin)
       0x3FD000 |        4182016 |          0x3FD |         0x3000 |          12288 | SYSTEM_PARTITION_SYSTEM_PARAMETER
       0x400000 |        4194304 = 4MB 
