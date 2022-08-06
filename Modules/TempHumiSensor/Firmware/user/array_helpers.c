#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "osapi.h"

#include "array_helpers.h"

ICACHE_FLASH_ATTR
void array_free(array_builder_t *builder)
{
    free(builder->bytes);
}

/* *********************************** ARRAY WRITE ************************************* */
ICACHE_FLASH_ATTR
void array_builder_checkforextend(array_builder_t *builder, unsigned short len)
{
    if (builder->size == 0) {
        builder->size = BUFFER_BLOCK_SIZE;
        builder->bytes = (unsigned char*)malloc(builder->size);
    }
    else if (builder->pos + len >= builder->size) {
        builder->size += BUFFER_BLOCK_SIZE;
        builder->bytes = (unsigned char*)realloc(builder->bytes, builder->size);
    }
}

ICACHE_FLASH_ATTR
void array_write_char(array_builder_t *builder, char value)
{
    array_builder_checkforextend(builder, 1);
    builder->bytes[builder->pos++] = (unsigned char)value;
}

ICACHE_FLASH_ATTR
void array_write_uchar(array_builder_t *builder, unsigned char value)
{
    array_write_char(builder, (char)value);
}

ICACHE_FLASH_ATTR
void array_write_short(array_builder_t *builder, short value)
{
    array_builder_checkforextend(builder, 2);
    builder->bytes[builder->pos++] = (unsigned char)value;
    builder->bytes[builder->pos++] = (unsigned char)(value >> 8);
}

ICACHE_FLASH_ATTR
void array_write_ushort(array_builder_t *builder, unsigned short value)
{
    array_write_short(builder, (short)value);
}

ICACHE_FLASH_ATTR
void array_write_int(array_builder_t *builder, int value)
{
    array_builder_checkforextend(builder, 4);
    builder->bytes[builder->pos++] = (unsigned char)value;
    builder->bytes[builder->pos++] = (unsigned char)(value >> 8);
    builder->bytes[builder->pos++] = (unsigned char)(value >> 16);
    builder->bytes[builder->pos++] = (unsigned char)(value >> 24);
}

ICACHE_FLASH_ATTR
void array_write_uint(array_builder_t *builder, unsigned int value)
{
    array_write_int(builder, (int)value);
}

ICACHE_FLASH_ATTR
void array_write_long(array_builder_t *builder, long long value)
{
    array_builder_checkforextend(builder, 8);
    builder->bytes[builder->pos++] = (unsigned char)value;
    builder->bytes[builder->pos++] = (unsigned char)(value >> 8);
    builder->bytes[builder->pos++] = (unsigned char)(value >> 16);
    builder->bytes[builder->pos++] = (unsigned char)(value >> 24);
    builder->bytes[builder->pos++] = (unsigned char)(value >> 32);
    builder->bytes[builder->pos++] = (unsigned char)(value >> 40);
    builder->bytes[builder->pos++] = (unsigned char)(value >> 48);
    builder->bytes[builder->pos++] = (unsigned char)(value >> 56);
}

ICACHE_FLASH_ATTR
void array_write_ulong(array_builder_t *builder, unsigned long long value)
{
    array_write_long(builder, (long long)value);
}

ICACHE_FLASH_ATTR
void array_write_bytes(array_builder_t *builder, unsigned char *bytes, unsigned short len)
{
    array_builder_checkforextend(builder, len);
    os_memcpy(&builder->bytes[builder->pos], bytes, len);
    builder->pos += len;
}
/* *********************************** ARRAY WRITE ************************************* */

/* *********************************** ARRAY READER ************************************* */
ICACHE_FLASH_ATTR
char array_read_checkforlen(array_builder_t *builder, unsigned char len)
{
    if (builder->pos + len >= builder->size)
    {
        return 0;
    }
    else
    {
        return 1;
    }
}

ICACHE_FLASH_ATTR
char array_read_char(array_builder_t *builder)
{
    char result = 0;
    if (array_read_checkforlen(builder, 1))
    {
        result = builder->bytes[builder->pos++];
    }
    return result;
}

ICACHE_FLASH_ATTR
unsigned char array_read_uchar(array_builder_t *builder)
{
    return (unsigned char)array_read_char(builder);
}

ICACHE_FLASH_ATTR
short array_read_short(array_builder_t *builder)
{
    short result = 0;
    if (array_read_checkforlen(builder, 2))
    {
        result = builder->bytes[builder->pos++];
        result |= builder->bytes[builder->pos++] << 8;
    }
    return result;
}

ICACHE_FLASH_ATTR
unsigned short array_read_ushort(array_builder_t *builder)
{
    return (unsigned short)array_read_short(builder);
}

ICACHE_FLASH_ATTR
int array_read_int(array_builder_t *builder)
{
    int result = 0;
    if (array_read_checkforlen(builder, 4))
    {
        result = builder->bytes[builder->pos++];
        result |= builder->bytes[builder->pos++] << 8;
        result |= builder->bytes[builder->pos++] << 16;
        result |= builder->bytes[builder->pos++] << 24;
    }
    return result;
}

ICACHE_FLASH_ATTR
unsigned int array_read_uint(array_builder_t *builder)
{
    return (unsigned int)array_read_int(builder);
}

ICACHE_FLASH_ATTR
long long array_read_long(array_builder_t *builder)
{
    long long result = 0;
    if (array_read_checkforlen(builder, 8))
    {
        result = builder->bytes[builder->pos++];
        result |= builder->bytes[builder->pos++] << 8;
        result |= builder->bytes[builder->pos++] << 16;
        result |= builder->bytes[builder->pos++] << 24;
        result |= (long long)builder->bytes[builder->pos++] << 32;
        result |= (long long)builder->bytes[builder->pos++] << 40;
        result |= (long long)builder->bytes[builder->pos++] << 48;
        result |= (long long)builder->bytes[builder->pos++] << 56;
    }
    return result;
}

ICACHE_FLASH_ATTR
unsigned long long array_read_ulong(array_builder_t *builder)
{
    return (unsigned long long)array_read_long(builder);
}
/* *********************************** ARRAY READER ************************************* */