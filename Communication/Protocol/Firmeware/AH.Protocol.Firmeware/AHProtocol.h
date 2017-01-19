/* 
 * File:   AHProtocol_Config.h
 * Author: Clive
 *
 * Created on 15 de Dezembro de 2016, 14:44
 */

#ifndef AHPROTOCOL_H
#define	AHPROTOCOL_H

#include "AHProtocol_Config.h"

typedef struct {
  IsConfirmation: 1;
  NeedConfirmation: 1;
} MessageConfigurationField;

struct MessagePackage {
	unsigned int16 SenderUID;
	unsigned int16 ReceiverUID;
	unsigned int16 BodyLength
	unsigned int8 MessageID;
	MessageConfigurationField Configuration;
	int8 MessageBody[];
}

#endif	/* AHPROTOCOL_H */