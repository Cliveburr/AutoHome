
AutoHome Protocol

This protocol defines the most top layer for the messages

1. Package

	Configuration
		UID - Define one unique identifier for this interface
			UID = 0 means broadcast message
		Timeout - Define the amout of time to waiting the OK message
		MessageArrive - Event that is raised when a new message income
		
	Header
		HeaderSize - Return the size of head
		byte[0] = low UID sender
		byte[1] = high UID sender, 2 << 8
		byte[2] = low UID receiver
		byte[3] = high UID receiver, 2 << 8
		byte[4] = low message body size
		byte[5] = high message body size
		byte[6] = message ID
		byte[7] = configuration
			00000001b = is confirmation message
			00000010b = need confirmation message
		byte[n] = message body

		Message ID
			one ID to identify this message
		
		Configuration
			a set of bits for general message properties

2. Send process

	Params
		UID
		MessageBody
		Callback (optional)
	Process
		check if this UID is busy
		if yes
			push the message onto schedule sender for this UID 
		if no
			set this UID in busy mode
			request a new message ID
			create the package
			push the package onto sender stack
			if has callback so, its require confirmation
				push the package with the callback waiting for the confirmation
				if no message confirmation comes before Timeout
					raise the callback with the cod "02 - Timeout"
			initilize the sender stack if is not

3. Sender stack

	while (has message on stack)
		get the first message
		get the driver of the physcial layer
		call the function SendMessage
	after send all message stop the sender stack
			
4. Receiver process

	Params
		Message
	Process
		push the message onto the receiver stack
		initilize the receiver stack if is not

5. Receiver stack

	while (has message on stack)
		parse the message
		if the message need confirmation
			create the confirmation message
			call the Send process
		if is confirmation message
			get the callback from the waiting
			raise the callback with the code "01 - Ok"
		else
			call MessageArrive
	