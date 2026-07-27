# Central

Índice da documentação da central. Leia documentos adicionais somente quando a tarefa exigir.

- `protocol.md`: como a central participa do protocolo de comunicação (ver também `docs/protocol.md` na raiz).
- `seguranca.md`: autenticação, papéis, sessões, auditoria e limites de exposição da central.
- `ota.md`: descoberta de binários locais, comparação por hash, execução individual e em lote de atualizações OTA.
- `interface.md`: navegação, telas e regras de acesso da interface web.
- `modulos.md`: ciclo de vida, inventário, configuração, vínculos e comandos de módulos.
- `dados.md`: coleções, índices, relações e retenção no MongoDB, incluindo idempotência de comandos e o buffer transitório de tempo real.
- `api.md`: contrato HTTP, comandos idempotentes e eventos WebSocket autenticados entre API e web.
- `openapi.yaml`: fonte canônica OpenAPI 3.1 do contrato HTTP publicado; gere o cliente com `npm run generate:api`.
- `operacao.md`: configuração de ambiente, inicialização, saúde, logs e persistência.
- `implementacao.md`: tarefas isoladas, critérios de aceite e verificações manuais para construir a central; T01–T10 concluídas.
