#include "c_types.h"
#include <sntp.h>
#include <osapi.h>

#include "user_config.h"

void ah_sntp_init(void)
{
    #ifdef DEBUG
        os_printf("ah_sntp_init...\n");
    #endif

    sntp_setservername(0, "a.st1.ntp.br");
    sntp_setservername(1, "b.st1.ntp.br");
    sntp_setservername(2, "c.st1.ntp.br");
    // sntp_setservername(0, "0.pool.ntp.org");
    // sntp_setservername(1, "1.pool.ntp.org");
    // sntp_setservername(2, "2.pool.ntp.org");
    sntp_init();
}

uint32_t ah_sntp_read(void)
{
    return sntp_get_current_timestamp();
}