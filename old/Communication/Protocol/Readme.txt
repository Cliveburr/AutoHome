
AutoHome Protocol

This protocol defines the most top layer for the messages

1. Package

	Configuration
		UID - Define one unique identifier for this interface
			UID = 0 means broadcast message
		MessageArrive - Event that is raised when a new message income
		
	Header
		HeaderSize = 6 bytes
		byte[0] = low UID sender
		byte[1] = high UID sender, 2 << 8
		byte[2] = low UID receiver
		byte[3] = high UID receiver, 2 << 8
		byte[4] = low message body size
		byte[5] = high message body size
		byte[n] = message body

2. Send process

	Params
		UID
		MessageBody
	Process
		create the package
		push the package to physcial layer

3. Receiver process

	Params
		Message
	Process
		generate the package
		push the package to top layer

