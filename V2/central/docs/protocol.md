# Protocolo — Central

Como a central participa do protocolo de comunicação. Especificação do cabeçalho em [`docs/cabecalho.md`](../../docs/cabecalho.md).

## Papel

- Escuta o grupo multicast Wi-Fi do plano de controle — recebe eventos, estados e `ack`s de módulos Wi-Fi diretamente, e de módulos Mesh através da ponte, que reencaminha por unicast IP no mesmo socket/porta, sem tratamento especial.
- Mantém um registro (`id` de texto → transporte atual e endereço resolvido: IP direto ou "via ponte X") usado para saber como alcançar cada módulo.
- Envia comandos ao grupo multicast (módulos Wi-Fi) ou por unicast ao IP da ponte (módulos Mesh); a ponte resolve o roteamento final dentro da mesh.
- Abre conexão TCP dedicada (plano de dados) com o módulo-alvo — direta em Wi-Fi, ou relayada pela ponte — para enviar firmware.
- Valida a tag de autenticação/integridade de toda mensagem recebida antes de processar; persiste histórico e eventos.

## Pendências de implementação

- Porta(s) UDP/TCP reservadas ao protocolo.
- Formato exato de serialização do payload.
- Modelo de chaves/pareamento usado na tag de autenticação.
