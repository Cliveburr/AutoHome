# Cabeçalho do Protocolo AutoHome

Especificação byte a byte do cabeçalho comum a toda mensagem do protocolo (ver [`protocol.md`](protocol.md) para a visão geral). É idêntico em Mesh e Wi-Fi — o que muda entre transportes é só o envelope externo, nunca este cabeçalho nem o payload.

Números de múltiplos bytes usam network byte order (big-endian). Textos usam UTF-8.

## Estrutura (versão 1)

| Ordem | Campo | Tamanho | Tipo |
|---|---|---|---|
| 1 | `versao` | 1 byte | uint8 |
| 2 | `tipo` | 1 byte | uint8 (enum) |
| 3 | `id_origem` | 32 bytes | texto, preenchido com zeros |
| 4 | `id_destino` | 32 bytes | texto, preenchido com zeros |
| 5 | `correlacao` | 8 bytes | uint64 |
| 6 | `sequencia` | 4 bytes | uint32 |
| 7 | `flags` | 1 byte | bitmask |
| 8 | `fragmento_indice` | 1 byte | uint8 |
| 9 | `fragmento_total` | 1 byte | uint8 |
| 10 | `tamanho_payload` | 2 bytes | uint16 |
| 11 | `tag_autenticacao` | 16 bytes | binário |

Cabeçalho total: **99 bytes**. O payload segue imediatamente após o cabeçalho, com o tamanho indicado em `tamanho_payload`.

## Detalhamento de cada campo

### `versao`

1 byte. Valores permitidos: 1–255. Identifica a versão do protocolo usada na mensagem; o receptor deve rejeitar versões que não reconhece. Valor 0 é inválido. Versão atual: `1`.

### `tipo`

1 byte, enum. Define o que o payload representa e como ele deve ser interpretado:

| Valor | Nome | Significado |
|---|---|---|
| `0x01` | discovery | Anúncio de presença, pareamento e capacidades |
| `0x02` | evento | Entrada detectada (ex.: botão pressionado, sensor mudou) |
| `0x03` | comando | Ação solicitada a uma capacidade (ex.: ligar relé) |
| `0x04` | estado | Publicação do estado atual de uma capacidade |
| `0x05` | config | Associações, cenas e parâmetros do módulo |
| `0x06` | telemetria | Métricas, diagnóstico e logs |
| `0x07` | ota | Transferência de firmware (plano de dados) |
| `0x08` | ack | Confirmação de recebimento/execução |
| `0x09` | erro | Falha ao processar uma mensagem anterior |
| `0x0A`–`0xFF` | reservado | Reservado para extensões futuras |

### `id_origem`

32 bytes de texto (UTF-8), preenchido com zeros à direita quando menor que 32 bytes. Identificador único e legível do remetente (módulo, central ou ponte), atribuído no pareamento — nunca o MAC ou o IP do dispositivo. Não pode ser vazio (primeiro byte diferente de zero).

Caracteres permitidos: letras minúsculas, números, hífen (`-`) e dois-pontos (`:`) — suficiente para ids como `sala-interruptor-01`.

### `id_destino`

Mesmo formato de `id_origem`. Valores especiais reservados:

| Valor | Significado |
|---|---|
| `*` (um asterisco, resto em zeros) | Broadcast geral — todos os participantes do transporte |
| `grupo:<nome>` | Grupo lógico configurado (ex.: `grupo:sala`) |
| id específico | Um único destinatário |

### `correlacao`

8 bytes, uint64. Liga uma mensagem à sua resposta/`ack`.

- `0`: mensagem sem correlação esperada (fire-and-forget — ex.: telemetria, discovery).
- Valor diferente de `0`: gerado pelo remetente que espera resposta; o `ack` ou a resposta correspondente deve devolver o mesmo valor.

### `sequencia`

4 bytes, uint32. Contador monotônico mantido por `id_origem`, incrementado a cada mensagem enviada pelo remetente, independente do destinatário. Usado com `id_origem` para descartar mensagens duplicadas recebidas dentro de uma janela recente (reenvio de rede). Reinicia em `0` após reboot do dispositivo. Wrap-around permitido: depois de `4294967295` volta a `0`.

### `flags`

1 byte, bitmask (bit 0 é o menos significativo):

| Bit | Nome | Significado quando `1` |
|---|---|---|
| 0 | `idempotente` | Comando idempotente (repetir não causa efeito colateral); quando `0`, é baseado em evento |
| 1 | `exige_ack` | O remetente espera confirmação explícita do destinatário |
| 2 | `fragmentado` | Mensagem dividida em múltiplos fragmentos (ver `fragmento_indice`/`fragmento_total`) |
| 3 | `payload_cifrado` | Reservado — payload cifrado além da tag de autenticação (não usado na versão 1) |
| 4–7 | reservados | Devem ser `0` na versão 1 |

### `fragmento_indice`

1 byte, uint8. Índice (0-based) do fragmento atual dentro da mensagem original. `0` quando o bit `fragmentado` de `flags` é `0`.

### `fragmento_total`

1 byte, uint8. Número total de fragmentos da mensagem original. `1` quando não fragmentado. Máximo de 255 fragmentos por mensagem — mensagens que exigirem mais devem ser divididas em múltiplas transferências (ex.: blocos de OTA).

### `tamanho_payload`

2 bytes, uint16. Tamanho em bytes do payload que segue o cabeçalho. Máximo teórico do campo: 65535. Na prática, o plano de controle usa payloads pequenos (limite exato definido pelo transporte, ver `protocol.md` de cada ponto); no plano de dados (OTA), corresponde ao tamanho do bloco/fragmento transmitido.

### `tag_autenticacao`

16 bytes, binário. HMAC (ou equivalente) truncado para 128 bits, calculado sobre todos os campos anteriores do cabeçalho mais o payload, usando a chave estabelecida no pareamento do dispositivo. Uma mensagem cuja tag não valide deve ser descartada sem processamento — obrigatório mesmo para o `ack` menor.

## Pendências

- Algoritmo exato de HMAC/assinatura e como a chave de pareamento é derivada.
- Limite prático de `tamanho_payload` por transporte (Mesh vs. Wi-Fi).
