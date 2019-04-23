/*
 * File:   newmain.c
 * Author: Clivedurr
 *
 * Created on 20 de Outubro de 2016, 17:40
 */
#pragma config FOSC = INTOSCIO  // Oscillator Selection bits (RC oscillator: CLKOUT function on RA6/OSC2/CLKOUT pin, Resistor and Capacitor on RA7/OSC1/CLKIN)
#pragma config WDTE = OFF        // Watchdog Timer Enable bit (WDT enabled)
#pragma config PWRTE = OFF      // Power-up Timer Enable bit (PWRT disabled)
#pragma config MCLRE = ON       // RA5/MCLR/VPP Pin Function Select bit (RA5/MCLR/VPP pin function is MCLR)
#pragma config BOREN = ON       // Brown-out Detect Enable bit (BOD enabled)
#pragma config LVP = ON         // Low-Voltage Programming Enable bit (RB4/PGM pin has PGM function, low-voltage programming enabled)
#pragma config CPD = OFF        // Data EE Memory Code Protection bit (Data memory code protection off)
#pragma config CP = OFF         // Flash Program Memory Code Protection bit (Code protection off)

#include <xc.h>
#include <stdio.h>

#define _XTAL_FREQ 20000000

void putch(unsigned char data) {
    while( ! PIR1bits.TXIF)          // wait until the transmitter is ready
        continue;
    TXREG = data;                     // send one character
}

char UART_Init(const long int baudrate)
{
  unsigned int x;
  x = (_XTAL_FREQ - baudrate*64)/(baudrate*64);   //SPBRG for Low Baud Rate
  if(x>255)                                       //If High Baud Rage Required
  {
    x = (_XTAL_FREQ - baudrate*16)/(baudrate*16); //SPBRG for High Baud Rate
    BRGH = 1;                                     //Setting High Baud Rate
  }
  if(x<256)
  {
    SPBRG = x;                                    //Writing SPBRG Register
    SYNC = 0;                                     //Setting Asynchronous Mode, ie UART
    SPEN = 1;                                     //Enables Serial Port
    //TRISC7 = 1;                                   //As Prescribed in Datasheet
    //TRISC6 = 1;                                   //As Prescribed in Datasheet
    CREN = 1;                                     //Enables Continuous Reception
    TXEN = 1;                                     //Enables Transmission
    return 1;                                     //Returns 1 to indicate Successful Completion
  }
  return 0;                                       //Returns 0 to indicate UART initialization failed
}

void UART_Write(char data)
{
  while(!TRMT);
  TXREG = data;
}

char UART_TX_Empty()
{
  return TRMT;
}

void UART_Write_Text(char *text)
{
  int i;
  for(i=0;text[i]!='\0';i++)
    UART_Write(text[i]);
}

void UART_Write_Text_Len(char *text, int length)
{
  for(int i = 0; i < length; i++)
    UART_Write(text[i]);
}

char UART_Data_Ready()
{
  return RCIF;
}

char UART_Read()
{
  while(!RCIF);
  return RCREG;
}

void UART_Read_Text(char *Output, unsigned int length)
{
  unsigned int i;
  for(int i=0;i<length;i++)
  Output[i] = UART_Read();
}

struct {
    unsigned int msg01: 1;
    unsigned int msg02: 1;
    unsigned int led01: 1;
    unsigned int led02: 1;
} bts;

void main(void) {
    
    UART_Init(9600);
    
    //INTCONbits.INTE = 0;
    //INTCONbits.GIE = 0;
    
    //CMCON = 0x07;         // Shut off the Comparator
    //VRCON = 0x00;         // Set no voltage reference
    //ANSEL = 0x00;   //disable all analog ports
    //ANSELH = 0x00;

    TRISA = 0b00000011;
    PORTA = 0b00000000;
    TRISB = 0b00001111;
    PORTB = 0b00000000;
    
    char uid = eeprom_read(0) + 3;
    char duid = 0;
    char buffer[5] = { '-', 0, 0, 0, '-' };

    while (1)
    {
        if (bts.msg01 != PORTBbits.RB0)
        {
            bts.msg01 = PORTBbits.RB0;
            if (bts.msg01)
            {
                duid = PORTAbits.RA1;
                duid = duid + (PORTAbits.RA0 * 2);
                
                buffer[0] = '-';
                buffer[1] = uid;
                buffer[2] = duid + 48;
                buffer[3] = 6 + 48;
                buffer[4] = '-';
                
                UART_Write_Text_Len(buffer, 5);
            }
        }
        
        if (bts.msg02 != PORTBbits.RB3)
        {
            bts.msg02 = PORTBbits.RB3;
            if (bts.msg02)
            {
                duid = PORTAbits.RA1;
                duid = duid + (PORTAbits.RA0 * 2);
                
                buffer[0] = '-';
                buffer[1] = uid;
                buffer[2] = duid + 48;
                buffer[3] = 8 + 48;
                buffer[4] = '-';
                
                UART_Write_Text_Len(buffer, 5);
            }
        }
        
        if (UART_Data_Ready())
        {
            UART_Read_Text(buffer, 5);
            
            if (buffer[0] == '-' && buffer[4] == '-' && buffer[2] == uid)
            {
                if (buffer[3] == '6')
                {
                    PORTAbits.RA6 = PORTAbits.RA6 ^ 1;
                }
                else if (buffer[3] == '8')
                {
                    PORTAbits.RA7 = PORTAbits.RA7 ^ 1;
                }   
            }
        }
    }
}

void mainab(void) {
    
    // https://electrosome.com/uart-pic-microcontroller-mplab-xc8/
    //SPBRGH  = 0x02;     //9600bps 20MHz Osc
    //int baudrate = 9600;
    //SPBRG   = (_XTAL_FREQ - baudrate * 64)/(baudrate * 64);    
    
    //RCSTAbits.SPEN = 1;   // 1 = Serial port enabled
    //RCSTAbits.CREN = 1;   // 1 = Enables Continuous Reception
    //TXSTAbits.TXEN = 1;   // 1 = Enables Transmission
    //TXSTAbits.SYNC = 0;   // 0 = Setting Asynchronous Mode, ie UART
    //TXSTAbits.BRGH = 0;   // 1 = High speed 
    UART_Init(9600);
    
    TRISA = 0b00000000;
    TRISB = 0b00000110;
    
    char rx[1] = { 0 };
    
    eeprom_write(0, 65);
    eeprom_write(1, 66);
    eeprom_write(2, 67);
    
    while (WR);
    
    char buf[32] = { 0 };
    for (int i = 0; i < 32; i++)
    {
        buf[i] = eeprom_read(i);
    }
    UART_Write_Text("EEPROM: ");
    UART_Write_Text(buf);
    
    while (1)
    {
        
        //PORTAbits.RA0 = 1; 
        //__delay_ms(500);
        //PORTAbits.RA0 = 0;
        //__delay_ms(500);
        
        //UART_Write_Text("Hello world\ntest value is %04d\n");
        
        if(UART_Data_Ready())
        {
            UART_Read_Text(rx, 1);
            
            if (rx[0] == '1')
                PORTAbits.RA0 = 1;
            else
                PORTAbits.RA0 = 0;
        }
    }
}
