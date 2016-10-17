
AutoHome Protocol



1. Package

	Configuration
		UID - Define one unique identifier for this interface
			UID = 0 means broadcast message
		MaxPackageSize - Define the size of package to send
		Timeout - Define the amout of time to waiting the OK message
		
	Header
		HeaderSize - Return the size of head
		byte[0] = low UID
		byte[1] = high UID, 2 << 8
		byte[2] = low UID
		byte[3] = high UID, 2 << 8
		byte[4] = message ID
		byte[5] = configuration
			byte[6] = fragment ID

		Message ID
			one ID to identify this message
		

2. Send process

	Params
		UID
		Message
		Callback
	Process
		check if this UID is busy
		if yes
			raise the callback with the code 01(Receiver not responding)
		if no
			request a new message ID
			create all package
				split the Message by (MaxPackageSize - HeaderSize)
				for each fragment, create the header
			push the packages to the send stack
			push the callback waiting for the return
			initilize the send stack if is not
				
				
			
		
		
Layers
	01 - Physical
		(Serial)
	02 - AutoHome Protocol

Serial Protocol
{
	- Have max package size, 32 bytes
	- All message from, and to, must started with 2 bytes for the size of message
	- To send:
		1. Split the message by max package size
		2. Send the size of message in 2 bytes format
		3. Send the packages
	- To receive:
		1. Read 2 bytes, is the size of message
		2. Read the count of packages for the size read
		3. Concat the packages to create the message
}
	
AutoHome Protocol
{
	- All node must have one unique identifier, UI
	- At initialize, send a handshake
		- Must be determine the max size of package

	Package:

	byte[0] = parte baixa do IP de destino, 16 bits
	byte[1] = parte alta do IP de destino 2 << 8

	IPs:
	0 = Invalido
	1 = Broadcast
	n = IP

	byte[2] = código da mensagem
		bit mais significativo indica msg com corpo

	byte[3] = parte baixa do tamanho do corpo, 16 bits
	byte[4] = parte alta do tamanho do corpo, 2 << 8

	byte[n] = corpo

	Codes:
	00000001b =   1 =   1 = OK - resposta OK sem corpo
	10000010b = 130 =   2 = OK - resposta OK com corpo
	00000011b =   3 =   3 = PING
	00000100b =   4 =   4 = Information Request
	00000101b =   5 =   5 = Module msg
	10000101b = 133 =   5 = Module msg com corpo
	00000110b =   6 =   6 = Module to Module message
	10000110b = 134 =   6 = Module to Module message com corpo
}
