#!/bin/bash

boot=new

echo "choose bin generate(1 = user1.bin, 2 = user2.bin)"
echo "enter (1/2, default 1):"
read input

if [ -z "$input" ]; then
    app=1
elif [ $input == 2 ]; then
    app=2
else
    app=1
fi

spi_speed=40

spi_mode=QIO

spi_size_map=4

echo ""
echo "start..."
echo ""

touch user/user_main.c

make clean

make COMPILE=gcc BOOT=$boot APP=$app SPI_SPEED=$spi_speed SPI_MODE=$spi_mode SPI_SIZE_MAP=$spi_size_map