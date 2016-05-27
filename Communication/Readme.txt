
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
