#ifndef __STORAGE_H__
#define __STORAGE_H__

#include <stdint.h>

typedef struct {
    uint32_t addr;
    uint32_t size;
} storage_partition_t;

typedef struct {
    char* id;
    uint32_t size;
} storage_info_t;

void storage_init(storage_partition_t* partition_table, uint8_t partition_count, storage_info_t* storage_table, uint8_t storage_count);
void storage_write(char* id, void* content);
void* storage_read(char* id);

#endif