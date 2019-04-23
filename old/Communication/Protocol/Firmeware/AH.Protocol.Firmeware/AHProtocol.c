/* 
 * File:   AHProtocol_Config.h
 * Author: Clive
 *
 * Created on 15 de Dezembro de 2016, 14:44
 */

void Send(MessagePackage package) {
	
}

void Receive(unsigned int8 msg[]) {
	
}

MessagePackage ParseMessage(unsigned int8 msg[]) {
	MessagePackage pckg;
	unsigned int8 i;
	unsigned int8 msgBody[pckg.BodyLength];

	pckg.SenderUID = msg[0] + (msg[1] << 8);
	
	pckg.ReceiverUID = msg[2] + (msg[3] << 8);
	
	pckg.BodyLength = msg[4] + (msg[5] << 8);
	
	pckg.MessageID = msg[6];
	
	pckg.Configuration = (MessageConfigurationField)msg[7];
	
	for (i = 0; i < pckg.BodyLength; i++) {
		msgBody[i] = msg[i + 8];
	}
	pckg.MessageBody = msgBody;
	
	return pckg;
}

unsigned int8[] CreateMessage(unsigned int16 senderUID, unsigned int16 receiverUID, unsigned int8 messageID, MessageConfigurationField configuration, unsigned int8 msg[] messageBody, unsigned int8 bodyLength) {
	unsigned int8 msg[Protocol_RX_Size];
	unsigned int8 i;
	
	msg[0] = senderUID;
	msg[1] = senderUID >> 8;
	
	msg[2] = receiverUID;
	msg[3] = receiverUID >> 8;
	
	msg[4] = bodyLength;
	msg[5] = bodyLength >> 8;
	
	msg[6] = messageID;
	
	msg[7] = configuration;
	
	for (i = 0; i < bodyLength; i++)
	{
		msg[8 + i] = messageBody[i];
	}

	return msg;	
}