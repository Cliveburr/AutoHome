/* 
 * File:   AHProtocol_Config.h
 * Author: Clive
 *
 * Created on 15 de Dezembro de 2016, 14:44
 */

#ifndef AHPROTOCOL_CONFIG_H
#define	AHPROTOCOL_CONFIG_H

#define UID               1                // Define the UID of this device
#define MessageArrive     void (*f)(int)   // Define one function to call when message arrive
#define Protocol_RX_Size  32               // Define the max size for the messages

#endif	/* AHPROTOCOL_CONFIG_H */