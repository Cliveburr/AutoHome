

Bom vendedor do mercado livre
http://produto.mercadolivre.com.br/MLB-734855460-fita-ultra-led-5050-rgb-300-leds-prova-dagua-rolo-5-metros-_JM
Bom vendedor do aliexpress
http://pt.aliexpress.com/item/High-quality-5m-300-LED-5050-SMD-12V-LED-strip-flexible-light-60-led-m-LED/1021790297.html?spm=2114.02010208.3.19.rb9e8k&ws_ab_test=searchweb201556_6,searchweb201644_3_10001_10002_10005_301_10006_10003_10004_401_62,searchweb201560_2,searchweb1451318400_6150,searchweb1451318411_6449&btsid=25fb1102-5063-4556-b592-e1fb6f69a209

Otimo tutorial
https://learn.adafruit.com/rgb-led-strips/overview

Formato de 3 leds por segmento

Modelo: SMD5050
Consumo: 5.76 W/m
Número de Leds: 60 pcs/m
Tensão:12 v

Tensão do led vermelho: 2,21v


Experimentos no proteus
{
	O controlador precisa manter distribuido a tensão nas cores
	Evitando a soma da corrente passar dos 20mA total nos leds

	Sessão RED
	Tensão nos leds: 2.25v
	Corrente: 17.5mA
	Resistor usado: 300ohms
	
	Sessão GREEN
	Tensão nos leds: 2.32v
	Corrente: 38.9mA
	Resistor usado: 130ohms
	
	Sessão BLUE
	Tensão nos leds: 2.32v
	Corrente: 38.9mA
	Resistor usado: 130ohms

	Corrente total: 95.2mA
	
	Rolo de 5 metros com 300 leds
	{
		3 led por segmento = 100 segmento
		100 * 95.2 = 9520mA = 9.52A
		
		300 / 5 = 60 led por metro
		60 / 3 = 20 segmento por metro
		20 * 95.2 = 1904mA = 1.9A
		
		A especificação diz 7,2W/metro
		7,2 * 5 = 36W
		p = v * i
		i = p / v
		corrente de 5m = 36 / 12 = 3A
	}
}

11m * 1.9A = 20,9A 
P = 12 * 20.9 = 250w

{

Brilho = 0 a 100%
Cores = RGB = 0 a 255

255 = 100%
  x = 30%
x = (30 * 255) / 100

corNoBrilho = (brilho * cor) / 100




ciclo = 100ms

100 = 255
  x = 127
x = (100 * 127) / 255
x = 49,8ms

ciclo = (100 * corNoBrilho) / 255


}

