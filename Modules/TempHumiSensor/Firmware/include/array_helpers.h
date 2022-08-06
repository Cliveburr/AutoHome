#ifndef __ARRAY_HELPERS_H__
#define __ARRAY_HELPERS_H__

#define BUFFER_BLOCK_SIZE 1024

typedef struct {
    unsigned char *bytes;
    unsigned int pos;
    unsigned int size;
} array_builder_t;

void array_free(array_builder_t *builder);

void array_write_char(array_builder_t *builder, char value);
void array_write_uchar(array_builder_t *builder, unsigned char value);
void array_write_short(array_builder_t *builder, short value);
void array_write_ushort(array_builder_t *builder, unsigned short value);
void array_write_int(array_builder_t *builder, int value);
void array_write_uint(array_builder_t *builder, unsigned int value);
void array_write_long(array_builder_t *builder, long long value);
void array_write_ulong(array_builder_t *builder, unsigned long long value);
void array_write_bytes(array_builder_t *builder, unsigned char *bytes, unsigned short len);

char array_read_char(array_builder_t *builder);
unsigned char array_read_uchar(array_builder_t *builder);
short array_read_short(array_builder_t *builder);
unsigned short array_read_ushort(array_builder_t *builder);
int array_read_int(array_builder_t *builder);
unsigned int array_read_uint(array_builder_t *builder);
long long array_read_long(array_builder_t *builder);
unsigned long long array_read_ulong(array_builder_t *builder);

#endif