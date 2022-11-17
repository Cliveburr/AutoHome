#ifndef __GPIOS_H__
#define __GPIOS_H__

typedef void (*gpios_intr_function)();

typedef enum {
    gpios_type_intr = 0,
    gpios_type_pulsar = 1
} gpios_intr_type_t;

typedef struct single_key_param {
    uint8_t gpio_id;
    gpios_intr_type_t type;
    os_timer_t timer;
    gpios_intr_function intr_cb;
    uint8_t state;
} gpios_intr_t;

void gpios_set_output_mode(uint8_t gpio_id, uint8_t state);
void gpios_set_output_state(uint8_t gpio_id, uint8_t state);
void gpios_set_output_high(uint8_t gpio_id);
void gpios_set_output_low(uint8_t gpio_id);
void gpios_set_button_intr(uint8_t gpio_id, gpios_intr_function intr_cb);
void gpios_set_button_pulsar(uint8_t gpio_id, gpios_intr_function intr_cb);

#endif