#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "osapi.h"
#include "mem.h"

#include "helpers/array_helpers.h"

ICACHE_FLASH_ATTR
void array_free(array_builder_t *builder)
{
    free(builder->bytes);
}

/* *********************************** ARRAY WRITE ************************************* */
ICACHE_FLASH_ATTR
void array_builder_checkforextend(array_builder_t *builder, uint16_t len)
{
    if (builder->size == 0) {
        builder->size = BUFFER_BLOCK_SIZE;
        builder->bytes = (uint8_t*)os_zalloc(builder->size);
    }
    else if (builder->pos + len >= builder->size) {
        builder->size += BUFFER_BLOCK_SIZE;
        builder->bytes = (uint8_t*)realloc(builder->bytes, builder->size);
    }
}

ICACHE_FLASH_ATTR
void array_write_char(array_builder_t *builder, char value)
{
    array_builder_checkforextend(builder, 1);
    builder->bytes[builder->pos++] = (uint8_t)value;
}

ICACHE_FLASH_ATTR
void array_write_uchar(array_builder_t *builder, uint8_t value)
{
    array_write_char(builder, (char)value);
}

ICACHE_FLASH_ATTR
void array_write_short(array_builder_t *builder, int16_t value)
{
    array_builder_checkforextend(builder, 2);
    builder->bytes[builder->pos++] = (uint8_t)value;
    builder->bytes[builder->pos++] = (uint8_t)(value >> 8);
}

ICACHE_FLASH_ATTR
void array_write_ushort(array_builder_t *builder, uint16_t value)
{
    array_write_short(builder, (int16_t)value);
}

ICACHE_FLASH_ATTR
void array_write_int(array_builder_t *builder, int32_t value)
{
    array_builder_checkforextend(builder, 4);
    builder->bytes[builder->pos++] = (uint8_t)value;
    builder->bytes[builder->pos++] = (uint8_t)(value >> 8);
    builder->bytes[builder->pos++] = (uint8_t)(value >> 16);
    builder->bytes[builder->pos++] = (uint8_t)(value >> 24);
}

ICACHE_FLASH_ATTR
void array_write_uint(array_builder_t *builder, uint32_t value)
{
    array_write_int(builder, (int32_t)value);
}

ICACHE_FLASH_ATTR
void array_write_long(array_builder_t *builder, int64_t value)
{
    array_builder_checkforextend(builder, 8);
    builder->bytes[builder->pos++] = (uint8_t)value;
    builder->bytes[builder->pos++] = (uint8_t)(value >> 8);
    builder->bytes[builder->pos++] = (uint8_t)(value >> 16);
    builder->bytes[builder->pos++] = (uint8_t)(value >> 24);
    builder->bytes[builder->pos++] = (uint8_t)(value >> 32);
    builder->bytes[builder->pos++] = (uint8_t)(value >> 40);
    builder->bytes[builder->pos++] = (uint8_t)(value >> 48);
    builder->bytes[builder->pos++] = (uint8_t)(value >> 56);
}

ICACHE_FLASH_ATTR
void array_write_ulong(array_builder_t *builder, uint64_t value)
{
    array_write_long(builder, (int64_t)value);
}

ICACHE_FLASH_ATTR
void array_write_bytes(array_builder_t *builder, uint8_t *bytes, uint16_t len)
{
    array_builder_checkforextend(builder, len);
    os_memcpy(&builder->bytes[builder->pos], bytes, len);
    builder->pos += len;
}

ICACHE_FLASH_ATTR
void array_write_string(array_builder_t* builder, char* str)
{
    uint8_t len = strlen(str);
    array_builder_checkforextend(builder, len + 1);
    builder->bytes[builder->pos++] = (uint8_t)len;
    os_memcpy(&builder->bytes[builder->pos], str, len);
    builder->pos += len;
}
/* *********************************** ARRAY WRITE ************************************* */

/* *********************************** ARRAY READER ************************************* */
ICACHE_FLASH_ATTR
char array_read_checkforlen(array_builder_t *builder, uint8_t len)
{
    if (builder->pos + len > builder->size)
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
uint8_t array_read_uchar(array_builder_t *builder)
{
    return (uint8_t)array_read_char(builder);
}

ICACHE_FLASH_ATTR
int16_t array_read_short(array_builder_t *builder)
{
    int16_t result = 0;
    if (array_read_checkforlen(builder, 2))
    {
        result = builder->bytes[builder->pos++];
        result |= builder->bytes[builder->pos++] << 8;
    }
    return result;
}

ICACHE_FLASH_ATTR
uint16_t array_read_ushort(array_builder_t *builder)
{
    return (uint16_t)array_read_short(builder);
}

ICACHE_FLASH_ATTR
int32_t array_read_int(array_builder_t *builder)
{
    int32_t result = 0;
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
uint32_t array_read_uint(array_builder_t *builder)
{
    return (uint32_t)array_read_int(builder);
}

ICACHE_FLASH_ATTR
int64_t array_read_long(array_builder_t *builder)
{
    int64_t result = 0;
    if (array_read_checkforlen(builder, 8))
    {
        result = builder->bytes[builder->pos++];
        result |= builder->bytes[builder->pos++] << 8;
        result |= builder->bytes[builder->pos++] << 16;
        result |= builder->bytes[builder->pos++] << 24;
        result |= (int64_t)builder->bytes[builder->pos++] << 32;
        result |= (int64_t)builder->bytes[builder->pos++] << 40;
        result |= (int64_t)builder->bytes[builder->pos++] << 48;
        result |= (int64_t)builder->bytes[builder->pos++] << 56;
    }
    return result;
}

ICACHE_FLASH_ATTR
uint64_t array_read_ulong(array_builder_t *builder)
{
    return (uint64_t)array_read_long(builder);
}

ICACHE_FLASH_ATTR
uint8_t* array_read_bytes(array_builder_t *builder, uint16_t len)
{
    if (array_read_checkforlen(builder, len))
    {
        uint8_t* bytes = (uint8_t*)os_zalloc(len);
        os_memcpy(bytes, &builder->bytes[builder->pos], len);
        builder->pos += len;
        return bytes;
    }
    else
    {
        return NULL;
    }
}

ICACHE_FLASH_ATTR
char* array_read_string(array_builder_t* builder)
{
    if (array_read_checkforlen(builder, 1))
    {
        uint8_t len = builder->bytes[builder->pos++];
        if (array_read_checkforlen(builder, len))
        {
            char* str = (char*)os_zalloc(len + 1);
            os_memcpy(str, &builder->bytes[builder->pos], len);
            builder->pos += len;
            return str;
        }
        else
        {
            return NULL;
        }
    }
    else
    {
        return NULL;
    }
}

ICACHE_FLASH_ATTR
void array_read_string_to(array_builder_t* builder, char* str)
{
    if (array_read_checkforlen(builder, 1))
    {
        uint8_t len = builder->bytes[builder->pos++];
        if (array_read_checkforlen(builder, len))
        {
            os_memcpy(str, &builder->bytes[builder->pos], len);
            builder->pos += len;
        }
    }
}
/* *********************************** ARRAY READER ************************************* */