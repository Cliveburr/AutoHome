# Protocolo — Firmware Gen1

Como o firmware ESP32 Gen1 implementa o protocolo de comunicação. Especificação do cabeçalho em [`docs/cabecalho.md`](../../../../docs/cabecalho.md).

## Transporte configurado por módulo

Cada módulo opera em um transporte por vez, Mesh ou Wi-Fi, definido na configuração recebida no pareamento.

## Modo Wi-Fi

- Anuncia seu `id` de texto via mDNS.
- Entra no grupo multicast do plano de controle para publicar e receber evento, comando, estado e `ack`.
- OTA e outras transferências de dados usam TCP unicast direto ao IP de quem inicia a transferência (a central).

## Modo Mesh

- Participa de uma rede ESP-WIFI-MESH (Espressif); o endereçamento interno é por MAC, mas a aplicação só lida com o `id` de texto — a resolução `id` → endereço mesh é interna ao firmware.
- Plano de controle usa broadcast/grupo da mesh — chega a outros módulos e, quando existe caminho até a raiz, à ponte.
- OTA é endereçado nó a nó (nunca broadcast), relayado pela ponte quando a origem é a central.
- A comunicação direta módulo-módulo (por exemplo, botão → relé) usa o roteamento nativo da mesh e não depende da ponte estar acessível externamente.

## Identificação

O `id` de cada módulo é uma string única, atribuída no pareamento e persistida localmente — nunca derivada do MAC.

## Pendências de implementação

- Escolha final da distribuição do ESP-WIFI-MESH a usar.
- Tamanho máximo de payload por transporte e regra de fragmentação.
- Detalhes de retomada de OTA após queda de energia.
