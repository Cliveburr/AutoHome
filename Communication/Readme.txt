
1. Client
	2. AutoHome Protocol
		3. Physical Protocol

Esp8266 - ESP-12F

Site da fabricante
https://github.com/espressif

Forum's oficial
http://bbs.espressif.com/
http://www.esp8266.com/

Toolchain na maquina virtual
http://bbs.espressif.com/viewtopic.php?f=5&t=2

Exemplos oficiais
https://github.com/esp8266/source-code-examples


Repositorio do git de um cara mtu bom
https://github.com/esp8266vn/esp-iot-led-blink


Tutorais
{
	http://www.espressif.com/en/products/hardware/esp8266ex/resources

	Start guide oficial
	https://espressif.com/en/support/explore/get-started/esp8266/getting-started-guide

	Simples blink - bem explicado
	http://www.instructables.com/id/Blink-for-ESP8266-native-like-arduino-using-Window/step6/Wiring-the-led/

	Demos
	https://github.com/espressif/ESP8266_IOT_PLATFORM

	Compilar no windows
	http://signusx.com/esp8266-windows-compilation-tutorial/
}


Etapas
{
	- Configurar o ambiente (ToolChain)
		- Instalar o SDK
			https://github.com/espressif/ESP8266_RTOS_SDK
		- Instalar o código de compilação para a o processador xtensa
			ToolChain já compilado para o windows
			http://domoticx.com/sdk-esp8266-xtensa-architecture-toolchain/
		- Instalar o Cygwin
		- Instalar o make.exe
	- Gerar o firmware
		- Executar o Makefile (Contem instruções para o make gerar o firmware)
	- Flash
		- Conectar
		- Desligar
		- Ativar o terminal para status flash
		- Ligar
		- Gravar
}

Downloads
{
	Espressif downloads
	http://www.espressif.com/en/support/download/sdks-demos

	RTOS_SDK
	https://github.com/espressif/ESP8266_RTOS_SDK
	
	Arduino Environment
	https://www.arduino.cc/en/Main/Software
	
	
	Xtensa compilado para windows
	http://domoticx.com/sdk-esp8266-xtensa-architecture-toolchain/
	
	Esptool
	https://github.com/espressif/esptool
	
	Flash
	{
		Espressif
		http://www.espressif.com/support/download/other-tools
	
		NodeMcu
		https://github.com/nodemcu/nodemcu-flasher
	}
	
	Cygwin
	https://www.cygwin.com/
}

Toolchain
{
	Oficial
	https://github.com/esp8266/esp8266-wiki/wiki/Toolchain
}