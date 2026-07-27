# Dados — Central

## Princípios

MongoDB é acessível somente pela central. Os identificadores públicos da API são estáveis e não expõem `_id` interno do MongoDB. Datas são armazenadas em UTC.

A central separa intenção administrativa, estado confirmado por módulos e histórico operacional. Dados enviados por módulo não substituem diretamente configurações desejadas pelo administrador.

## Coleções

| Coleção | Responsabilidade | Índices principais |
| --- | --- | --- |
| `users` | Usuários internos, papel, estado e hash de senha. | `username` único |
| `sessions` | Sessões autenticadas e invalidação. | identificador de sessão único, expiração |
| `audit_logs` | Registro imutável de ações auditáveis. | data/hora, usuário, alvo, ação, resultado |
| `areas` | Organização física de alto nível. | posição |
| `rooms` | Cômodos de uma área opcional. | `areaId`, posição |
| `modules` | Inventário, identidade, capacidades, transporte e organização. | `protocolId` único, família, `roomId`, disponibilidade |
| `module_states` | Último estado confirmado, disponibilidade e última comunicação. | `moduleId` único, última comunicação |
| `module_configurations` | Configurações desejadas, enviadas e confirmadas. | `moduleId`, estado de sincronização |
| `commands` | Solicitações operacionais, correlação e confirmação. | `commandId` único, `solicitante + Idempotency-Key` único, `moduleId`, estado, data/hora |
| `ota_jobs` | Execuções individuais ou em lote de OTA. | data/hora, família, estado |
| `ota_job_items` | Resultado de OTA por módulo. | `otaJobId`, `moduleId`, estado |

## Regras de Modelagem

- Um módulo tem no máximo um `roomId`; ele pode não ter cômodo.
- Um cômodo pode ter uma área ou permanecer sem área.
- O estado atual consultado pela interface vem de `module_states` e deve indicar quando está desatualizado ou indisponível.
- `commands` preserva solicitante interno, alvo interno, conteúdo já validado da solicitação, identificador de correlação, chave de idempotência, estado, datas de envio/conclusão e motivo seguro de falha. Esses campos internos não fazem parte da projeção HTTP pública.
- `module_configurations` preserva as versões desejada, enviada e confirmada sem depender de um contador textual de versão.
- `ota_job_items` registra o hash esperado, progresso, estado e resultado de cada módulo.
- `audit_logs` não armazena senhas, hashes de senha, cookies, tokens ou binários.

## Retenção

Auditoria, inventário, configurações, comandos e histórico de OTA não expiram automaticamente no MVP. O buffer de eventos em tempo real é limitado, em memória e descartado ao reiniciar; ele serve somente à reconexão e nunca substitui `commands`, `module_states` ou consultas HTTP. Telemetria e histórico de sensores não são coletados como série temporal no MVP; sua retenção será definida quando essas capacidades entrarem no escopo.
