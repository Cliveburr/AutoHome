#include <18F4550.h>
#fuses NOMCLR, HSPLL, PLL5, CPUDIV1, USBDIV, NOWDT, PUT, BROWNOUT, NOLVP, NOPROTECT, NODEBUG, VREGEN, NOPBADEN
#use delay(clock=48000000)

#use fast_io(b)
#use fast_io(c)

#define USB_HID_DEVICE  TRUE

#define USB_EP1_TX_ENABLE  USB_ENABLE_INTERRUPT
#define USB_EP1_TX_SIZE    33

#define USB_EP1_RX_ENABLE  USB_ENABLE_INTERRUPT
#define USB_EP1_RX_SIZE    33

#use rs232(baud=9600, parity=N, bits=8, xmit=PIN_D1, rcv=PIN_D0, stream=A)

#include <pic18_usb.h>
#include "AlmHIDconf.h"
#include <USB.c>
#include <stdlibm.h>

#define DEBUG_STREAM_A TRUE

int8 rdata[USB_EP1_RX_SIZE];
int8 envia[USB_EP1_TX_SIZE];
void receive_msg();
void copy_array(unsigned int8* source, unsigned int16 isource, unsigned int8* target, unsigned int16 itarget, unsigned int16 size);
void process_msg(unsigned int16 ip, unsigned int8 code, unsigned int16 bodyLength, unsigned int8* body);

void main(void)
{
   int i;

   set_tris_b(0x10000000);
   
   output_high(PIN_B0);
   delay_ms(500);
   output_low(PIN_B0);
   
   fprintf(A, "rs232 init...\n\r");
   
   usb_init_cs();

   while(1)
   {
      if(input(PIN_B7))
      {
         output_high(PIN_B0);

         usb_task();

         while(input(PIN_B7))
         {
            if (usb_enumerated())
            {
               if (usb_kbhit(1))
               {
                  receive_msg();
                  //usb_get_packet(1, rdata, 1);
               
                  //fprintf(A, "%u", rdata[0]);
                  //switch(rdata[0])
                  //{
                  //   case 0x01: output_high(PIN_B0); break;
                  //   case 0x02: output_low(PIN_B0); break;
                  //}
               }
            }
         }
      
         usb_detach();
         
         output_low(PIN_B0);
      }
   }
}

void receive_msg()
{
   unsigned int16 ip, lbody, index, pl;
   unsigned int8 msg[USB_EP1_RX_SIZE - 1], code, *body;
   unsigned int1 hasBody;
   
   usb_get_packet(1, msg, USB_EP1_RX_SIZE - 1);
   
   ip = (msg[0] + (msg[1] * 256));
   hasBody = bit_test(msg[2], 7);
   code = msg[2];
   bit_clear(code, 7);
  
#ifdef DEBUG_STREAM_A
   fprintf(A, "receive_msg IP: %Lu - Code: %u - HasBody: %u\n\r", ip, code, hasBody);
#endif

   if (hasBody)
   {
      lbody = (msg[3] + (msg[4] * 256));
      
      body = calloc(lbody - 1, sizeof(unsigned int8));
      
      pl = lbody;
      if (pl > USB_EP1_RX_SIZE - 6)
         pl = USB_EP1_RX_SIZE - 6;
      
      copy_array(msg, 5, body, 0, pl);
      index = pl;
      
      while(index < lbody - 1)
      {
         pl = lbody - index;
         if (pl > USB_EP1_RX_SIZE - 1)
            pl = USB_EP1_RX_SIZE - 1;
      
         while (!usb_kbhit(1));
         usb_get_packet(1, msg, USB_EP1_RX_SIZE - 1);
         copy_array(msg, 0, body, index, pl);

         index += pl;
      }
   
      process_msg(ip, code, lbody, body);
   
      if (body)
      {
         free(body);
      }
   }
   else
   {
      process_msg(ip, code, 0, body);
   }
}

void copy_array(unsigned int8* source, unsigned int16 isource, unsigned int8* target, unsigned int16 itarget, unsigned int16 size)
{
   unsigned int16 i;
   for (i = 0; i < size; i++)
   {
      target[itarget + i] = source[isource + i];
   }
}

void process_msg(unsigned int16 ip, unsigned int8 code, unsigned int16 bodyLength, unsigned int8* body)
{
#ifdef DEBUG_STREAM_A
   char* sbody;
#endif


#ifdef DEBUG_STREAM_A
   if (bodyLength > 0)
   {
      sbody = &body[0];
      fprintf(A, "process_msg IP: %Lu - Code: %u - BodyLength: %Lu\n\r", ip, code, bodyLength);
      fprintf(A, "Body: %s\n\r", sbody);
   }
   else
   {
      fprintf(A, "process_msg IP: %Lu - Code: %u\n\r", ip, code);
   }
#endif

}
