#include<16F628A.h>
#fuses intrc_io, nowdt, protect, put, nomclr, nobrownout, nocpd, nolvp
#use delay(clock=4000000)
#use fast_io(a)
#use fast_io(b)
//xmit => TX ; rcv => RX
//#use rs232(BAUD = 9600, parity= N, bits = 8, UART1)
#use rs232(baud=9600, parity=N, bits = 8, xmit=PIN_B5, rcv=PIN_B4, bits=8)
//#include<String.h>
//#include<pic.h>

void main() 
{ 
   unsigned int8 t;

   //set_tris_a(0b00000000);
   set_tris_b(0b00010000);
   
   printf("foi: ");
   
   t = read_eeprom(0);
   printf("%u", t);

   //while(1)
   //{ 
//      printf("rain"); 
//   } 
}
