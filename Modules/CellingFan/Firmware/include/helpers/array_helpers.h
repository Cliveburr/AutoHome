#ifndef __ARRAY_HELPERS_H__
#define __ARRAY_HELPERS_H__

#include <stdint.h>

#define BUFFER_BLOCK_SIZE 1024

typedef struct {
    uint8_t *bytes;
    uint32_t pos;
    uint32_t size;
} array_builder_t;

void array_free(array_builder_t *builder);

void array_write_char(array_builder_t *builder, char value);
void array_write_uchar(array_builder_t *builder, uint8_t value);
void array_write_short(array_builder_t *builder, int16_t value);
void array_write_ushort(array_builder_t *builder, uint16_t value);
void array_write_int(array_builder_t *builder, int32_t value);
void array_write_uint(array_builder_t *builder, uint32_t value);
void array_write_long(array_builder_t *builder, int64_t value);
void array_write_ulong(array_builder_t *builder, uint64_t value);
void array_write_bytes(array_builder_t *builder, uint8_t *bytes, uint16_t len);
void array_write_string(array_builder_t* builder, char* str);

char array_read_char(array_builder_t *builder);
uint8_t array_read_uchar(array_builder_t *builder);
int16_t array_read_short(array_builder_t *builder);
uint16_t array_read_ushort(array_builder_t *builder);
int32_t array_read_int(array_builder_t *builder);
uint32_t array_read_uint(array_builder_t *builder);
int64_t array_read_long(array_builder_t *builder);
uint64_t array_read_ulong(array_builder_t *builder);
uint8_t* array_read_bytes(array_builder_t *builder, uint16_t len);
char* array_read_string(array_builder_t* builder);
void array_read_string_to(array_builder_t* builder, char* str);

#endif