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

OpenAPI é a fonte canônica do contrato HTTP. A definição versionada está em [`openapi.yaml`](openapi.yaml). A interface web usa cliente TypeScript gerado a partir dessa definição, sem manter rotas e tipos duplicados manualmente.

O primeiro recorte publicado cobre saúde, início e encerramento de sessão, troca da própria senha e consulta da sessão atual. Autenticação usa exclusivamente o cookie assinado `autohome_session`; o contrato não introduz token Bearer nem expõe o identificador interno da sessão.

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

Um comando é solicitado por `POST /commands` com `{ protocolId, capabilityId, action, parameters }` e o cabeçalho obrigatório `Idempotency-Key`. A chave é única por solicitante: uma repetição retorna o mesmo recurso e não cria novo despacho nem nova auditoria. O destino precisa estar adotado e a ação e os parâmetros completos precisam corresponder à capacidade declarada, incluindo tipo, enumeração e limites.

Estados são `aguardando`, `enviado`, `confirmado`, `falhou` e `indisponivel`. A central persiste primeiro a intenção, marca o encaminhamento e só então aceita a confirmação, falha ou indisponibilidade cuja correlação corresponda ao comando enviado. A projeção de `GET /commands/{commandId}` não inclui `_id`, sessão, solicitante interno, correlação ou segredos.

## Tempo Real

O canal WebSocket é `GET /api/v1/realtime` e usa o cookie assinado `autohome_session`; usuários `basico` e `administrador` com senha já alterada podem conectar. O cursor opcional é enviado como `?eventId=<ultimo-evento-processado>`. Eventos seguem o envelope:

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
- `realtime.reconciliation.required`

A reconexão recebe somente os eventos posteriores ao cursor, na ordem publicada, enquanto ele existir no buffer em memória. Cursor expirado, desconhecido ou de uma central reiniciada recebe `realtime.reconciliation.required`, cujos recursos indicam recarregar `GET /modules` e o detalhe necessário, incluindo `GET /commands/{commandId}`. O buffer não é fonte de verdade nem contém cookie, auditoria ou pacote bruto do transporte.

## Limites

A API não expõe diretamente mensagens brutas do protocolo de módulos à interface web. O adaptador da central traduz o protocolo compartilhado em recursos, comandos, estados e eventos deste contrato.
