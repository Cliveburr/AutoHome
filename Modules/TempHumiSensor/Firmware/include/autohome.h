#ifndef __AUTOHOME_H__
#define __AUTOHOME_H__

typedef void (*Feature_Init_Delegate)();

typedef struct {
    Feature_Init_Delegate init;
} Feature;

void autohome_init(void);
void autohome_tcp_recv(struct espconn* pesp_conn, char* data);
void autohome_udp_recv(struct espconn* espconnv, remot_info* pcon_info, char* data);

#endif