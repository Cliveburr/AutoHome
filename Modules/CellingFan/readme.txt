
<done> - fazer um esquema e entender como funciona o ventilador normal

<done> - fazer esquema de como seria com os reles
	ok - verificar diferença dos reles 5V 12V 24V e das fonte (pegar 3.3v)(não tem diferença de valor)

- testar na protoboard o esquema
	ok - testar os reles
	ok - testar enviar tensão 3.3v por longa distancia
	- testar a combinação do capacitor
	ok - confirmar quantidade de gpio
	ok - confirmar tamanhos do rele, adptadores, esp, modulo
	ok - confirmar o acionamento do rele com 3.3v e o resitor de 1k
	ok - os buracos da pcb são metalizados, pode colocar component PTH na top layer
	ok - adicionar resistor 10k no en e no gpio15

<done> - comprar componentes faltantes

<done> - encomendar placas

<done> - codificar o modulo

<done> - testar o modulo na protoboard

- criar WebMobile
	- criar intro
	- criar discovery
	- criar apis
	




Tutorial sobre motores
https://dicasdozebio.com/2014/12/31/dica-conheca-e-conserte-os-ventiladores-de-teto/




Anuncios:

Reles:
https://www.aliexpress.com/item/1005004369723431.html?spm=a2g0o.productlist.0.0.28aabc9fAu3oYs&algo_pvid=c6808345-dea5-4abb-a438-33698d1c6e6f&aem_p4p_detail=202208041005149287400685414400040334791&algo_exp_id=c6808345-dea5-4abb-a438-33698d1c6e6f-19&pdp_ext_f=%7B%22sku_id%22%3A%2212000028935129332%22%7D&pdp_npi=2%40dis%21BRL%21206.58%21206.58%21%21%21%21%21%402101d68d16596327147606678e0d24%2112000028935129332%21sea&curPageLogUid=TwtUxvPsq7es

Power:
https://www.aliexpress.com/item/1005003391874818.html?spm=a2g0o.productlist.0.0.46673676scHkk9&algo_pvid=692d9f70-dfee-4de6-894a-8c492d8e5132&algo_exp_id=692d9f70-dfee-4de6-894a-8c492d8e5132-18&pdp_ext_f=%7B%22sku_id%22%3A%2212000025567503572%22%7D&pdp_npi=2%40dis%21BRL%21113.1%21113.1%21%21%21%21%21%402101d8b516596352553105835e1e46%2112000025567503572%21sea&curPageLogUid=8x6dzuFs7XmL

Diodes:
https://www.aliexpress.com/item/1005003540554760.html?spm=a2g0o.productlist.0.0.7f30719feelzoI&algo_pvid=528119de-2253-4914-9054-a5caf952d5ef&algo_exp_id=528119de-2253-4914-9054-a5caf952d5ef-0&pdp_ext_f=%7B%22sku_id%22%3A%2212000026223166882%22%7D&pdp_npi=2%40dis%21BRL%212.05%211.94%21%21%2123.34%21%21%402101e9d316596363177022185e987d%2112000026223166882%21sea&curPageLogUid=zrr8QwrxC3XB
user o 1N4007


Transistor BC548:


Block 3:




Instalação no teto:
	- Identificar fase e neutro
	- Ligar o neutro no comum do ventilador
	- Conectar a fase e o neutro na placa conforme indicação (Live = fase, Ground = neutro)
	- Conectar os dois retornos do ventilador na placa no FW1 e FW2
	- Conectar o capacitor na placa sendo (R = fio vermelho commum, G = fio verde menor valor, B = fio preto maior valor) (atenção para os menor e maior valor idenpendente de cores)

	Luz:
	- Ligar o neutro em um dos fios da luz
	- Conectar o outro fio da luz na placa no LO

	Interruptores:
	- Ligar terra (não o neutro, o terra mesmo) no centro dos interruptores
	- Conectar o interruptor da luz no LI
	- Conectar o interruptor de on/off do ventilador no FI1
	- Conectar o interruptor (push) de velocidade no FI2
	


