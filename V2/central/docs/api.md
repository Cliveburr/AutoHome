# API e Tempo Real — Central

## Convenções

A API HTTP é versionada sob `/api/v1` e usa JSON. Datas são ISO 8601 em UTC. Recursos retornam IDs públicos estáveis; `_id` do MongoDB nunca é exposto.

Erros têm formato único:

```json
{
  "code": "MODULE_OFFLINE",
  "message": "O módulo está indisponível.",
  "details": {},
  "requestId": "..."
}
```

Listas suportam paginação, ordenação, busca e filtros quando aplicável. Toda mutação exige sessão autenticada, verifica papel e registra auditoria.

OpenAPI é a fonte canônica do contrato HTTP. A interface web usa cliente TypeScript gerado a partir dessa definição, sem manter rotas e tipos duplicados manualmente.

## Recursos HTTP

| Recurso | Responsabilidade | Acesso |
| --- | --- | --- |
| `/auth` | Login, logout, troca obrigatória e alteração da própria senha. | autenticado quando aplicável |
| `/me` | Sessão e usuário atual. | autenticado |
| `/users` | Gestão de usuários internos. | administrador |
| `/areas` | Cadastro de áreas. | administrador |
| `/rooms` | Cadastro de cômodos e vínculo com área. | administrador |
| `/discovery` | Consulta e adoção de módulos descobertos. | administrador |
| `/modules` | Inventário, detalhe, diagnóstico e configurações. | leitura autenticada; mutação administrativa |
| `/commands` | Envio e consulta de comandos operacionais. | autenticado |
| `/ota` | Consulta, reconciliação e execução de OTA. | administrador |
| `/audit-logs` | Consulta de auditoria. | administrador |
| `/health` | Estado técnico da central, sem dados sensíveis. | definido pela operação |

O contrato OpenAPI detalha esquemas de requisição e resposta, códigos HTTP e validações de cada recurso antes da implementação.

## Comandos

Um comando é solicitado por `POST /commands` com destino, ação, parâmetros e uma chave de idempotência. A resposta retorna um `commandId` e estado inicial, nunca uma confirmação antecipada do módulo.

Estados mínimos são `aguardando`, `enviado`, `confirmado`, `falhou` e `indisponivel`. O cliente consulta `GET /commands/{commandId}` ou recebe atualizações em tempo real.

## Tempo Real

O canal WebSocket usa a sessão web autenticada. Eventos seguem o envelope:

```json
{
  "eventId": "...",
  "type": "module.state.changed",
  "occurredAt": "2026-07-26T00:00:00.000Z",
  "data": {}
}
```

Eventos iniciais:

- `module.state.changed`
- `module.availability.changed`
- `command.updated`
- `ota.item.updated`
- `discovery.module.seen`

A reconexão informa o último `eventId` processado. A central reenvia eventos disponíveis após esse cursor ou exige reconciliação pela API quando o cursor não puder ser atendido.

## Limites

A API não expõe diretamente mensagens brutas do protocolo de módulos à interface web. O adaptador da central traduz o protocolo compartilhado em recursos, comandos, estados e eventos deste contrato.