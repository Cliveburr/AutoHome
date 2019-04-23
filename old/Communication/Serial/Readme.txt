

Serial Protocol
{
	- Can variable the size
	No - Have max package size, 32 bytes
	No - All message from, and to, must started with 2 bytes for the size of message
	- To send:
		1. Just send the message
		No 1. Split the message by max package size
		No 2. Send the size of message in 2 bytes format
		No 3. Send the packages
	- To receive:
		1. Just read the message
		No 1. Read 2 bytes, is the size of message
		No 2. Read the count of packages for the size read
		No 3. Concat the packages to create the message
}


RS485 AH1 Protocol
{
	- Multimaster
	- Halfduplex
	
	MAX485
	DE - Drive Enable -> Must be high when transmiting
	RE - Receiver Enable -> Must be low when receiving
	RO - Receiver Output
	DI - Data Input

	- Need to be register the UI
	- Keep RE always low, to loopback own package
	- Time to send one byte, ByteTime BT
	- Package for cycle, PC, 5 bytes from 3 for header, 1 for AH1 configuration, and 1 for waiting
	
	Byte AH1 Configuration
			0 - enter cycle
			1 - has message
			2 - future
			3 - future
			4 - future
			5 - future
			6 - future
			7 - future
	
	- At initialize:
		Parameters: UI
		- For PCx2 time, begin receive message to identify if already have one cycle running
		- If has no cycle running
			- For PCxUI+1 time, begin receive message
			- If no receive message
				- Send a enter cycle message
			- If has message
				- Put the sender into the cycle list
				- For PCx(UI-(Sender.UI))+1 time, begin receive message
					- If no receive message
						- Send a enter cycle
					- If has message
						- Loop to waiting more
		- If has cycle
			
			
		- Generate a unique timer, UT, from the UI
		- Delay the UT
	- To Send:
		- Check if the wire A is in waiting stage
		- Write the





	- Ao iniciar:
		- Recebe mensagens por dois ciclo
			- Se não receber nenhuma mensagem, significa que não tem ninguem conectado, entra 
	- Ciclo:
		- Começando do primeiro para o ultimo
		- Cada unidade na sua vez transmite um pacote dizendo se tem ou não mensagem
			- Se tiver mensagem, transmite logo em seguida
		
}

RS485 AH1 PtP Protocol
{
	- Point-to-point
	- Fullduplex
}