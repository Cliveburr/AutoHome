# Protocolo de Comunicação AutoHome

Visão macro do protocolo compartilhado por módulos, central e ponte. Detalhes específicos de cada lado ficam em [`central/docs/protocol.md`](../central/docs/protocol.md) e [`modules/gen1/firmware/docs/protocol.md`](../modules/gen1/firmware/docs/protocol.md).

## Identificação

Todo participante (módulo, central, ponte) tem um `id` único em texto, atribuído no pareamento. O `id` nunca é o MAC ou o IP do dispositivo — cada transporte resolve o `id` para seu próprio endereço físico (IP em Wi-Fi, endereço interno em Mesh).

## Duas classes de mensagem

- **Plano de controle:** descoberta/anúncio, evento, comando, estado, telemetria, confirmação (`ack`). Pacotes pequenos, entregues em grupo — todo interessado recebe a mesma mensagem —, sem conexão.
- **Plano de dados:** transferência de firmware e, no futuro, áudio dos terminais de voz. Exige canal confiável e endereçado ponto a ponto, nunca entregue em grupo.

## Cabeçalho comum

Idêntico nos dois transportes — versão, tipo, ids de origem/destino, correlação, sequência, flags, tamanho e tag de autenticação. Especificação byte a byte em [`cabecalho.md`](cabecalho.md).

O que muda entre Mesh e Wi-Fi é só o envelope de transporte — como o pacote é endereçado e entregue fisicamente —, nunca o payload da aplicação.

## Transportes

- **Wi-Fi (módulos e central):** descoberta por mDNS, plano de controle por multicast UDP, plano de dados por TCP unicast direto ao IP resolvido.
- **Mesh (módulos ESP32):** usa ESP-WIFI-MESH (Espressif), rede em árvore com nó raiz. Plano de controle por broadcast/grupo dentro da mesh; plano de dados endereçado nó a nó, relayado pela ponte quando cruza para fora da mesh.

## Ponte

A ponte é o nó raiz da mesh e, ao mesmo tempo, um participante comum na rede Wi-Fi: fala o mesmo protocolo de controle que qualquer módulo Wi-Fi, sem tratamento especial na central. Ela só traduz o envelope de transporte (mesh ↔ IP); nunca decide automação.

**Restrição de hardware confirmada:** o nó raiz de uma rede ESP-WIFI-MESH precisa ser um chip ESP32 rodando a pilha de mesh da Espressif — não é possível usar um Raspberry Pi puro como raiz da mesh. Um Raspberry Pi só participa como ponte se tiver um ESP32 dedicado atuando como rádio de mesh.

## Módulos fora do ESP32

Hardware não-ESP32 (por exemplo, um terminal de voz em Raspberry Pi ou Arduino) usa exclusivamente o transporte Wi-Fi — nunca participa da Mesh.

## Confiabilidade

- Plano de controle: reenvio limitado com timeout, sequência e id de correlação para deduplicar; comandos idempotentes são preferidos.
- Plano de dados: confiabilidade do próprio TCP (Wi-Fi) ou do controle de fluxo da mesh (multi-hop); transferências devem ser retomáveis após queda de energia.

## Segurança

Toda mensagem carrega uma tag de autenticação/integridade, mesmo as menores — broadcast/multicast facilita a qualquer dispositivo da rede local escutar o tráfego, então a autenticidade tem que vir do payload, nunca do meio de transporte. Chaves são estabelecidas no pareamento (framework, fora do escopo deste documento).
