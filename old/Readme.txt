
Tasks

	- aplicar ao led real
		comprar mosft e acoplador optico
	- salvar as config no flash
	- montar a rotação entre access point e station
		configurar e descobrir por modo AP
		tornar dinamico o UID
	- montar o FOTA


1 - Layer Interface
	- WebUI
	- App
	- Mobile
		Android

2 - Layer Control
	- Service Api
	{
		- Software
			Core .NET (Cross plataform)
			SQL
		- Hardware 1
			Raspberry on Raspbian
			Communication with USB to one PIC18
			PIC18 communication with the next layer
		- Hardware 2
			Raspberry on Windows 10 IoT
			Communication directly with the next layer
	}
	
3 - Layer Communication
	- Protocol
	- Wireless
	{
		- HC-12
			Communication UART
	}
	- Serial
	{
		- RS232, RS485, RS422
	}
	- USB
	{
	}

4 - Layer Module
	- Ribbon Led RGB
	{
		- PIC16
			Communication UART
			Power 5V for the PIC16
			Power 18V high ampere
	}


	



	
Como usar grava��o in-line
http://electronics.stackexchange.com/questions/145266/pic18f4550-external-oscillator


Color Picker
https://github.com/DavidDurman/FlexiColorPicker

Angular 2 Color Picker Component
https://github.com/Alberplz/angular2-color-picker


WebUI
{
	Home
	Area
	Data
		Module
		Standards
			RgbLight
		Area
		
	Editor
		RgbLight
	
}

Standard
	Manual
	Picker