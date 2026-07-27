# Plano de Implementação — Central

## Uso

Cada tarefa é uma entrega isolada: só é concluída quando seus testes automatizados passam e sua verificação manual é realizada. A execução é sequencial, mas uma tarefa não deve incluir itens de tarefas posteriores.

O protocolo compartilhado de módulos ainda possui pendências. Por isso, a central usa uma interface de transporte e um adaptador simulado até que `docs/protocol.md` e o contrato do `gen1` definam serialização, portas, pareamento, mensagens de estado, configuração e OTA.

## Convenções de Teste

- **Unitário:** regra de domínio sem MongoDB, rede ou sistema de arquivos real.
- **Integração:** API, banco isolado na instância MongoDB local configurada, sessão HTTP, WebSocket ou sistema de arquivos temporário.
- **Contrato:** OpenAPI validado contra rotas e cliente TypeScript gerado.
- **E2E:** navegador contra API e MongoDB locais, cobrindo fluxos do usuário.
- **Manual:** realizado imediatamente após a tarefa, em ambiente local de desenvolvimento.

Todos os testes devem rodar sem usar o banco, firmware ou dispositivos reais da instalação. Dados de teste são descartáveis.

## Fundação

### T01 — Inicializar o workspace da central — CONCLUÍDA

**Escopo:** criar o workspace TypeScript com `central/api` e `central/web`, `npm` workspaces, configuração compartilhada de lint, formatação, TypeScript estrito e variáveis de ambiente de exemplo. Definir comandos `dev`, `build`, `lint` e `test` em cada aplicação.

**Automatizado:** `npm run build`, `npm run lint` e `npm run test` no workspace devem concluir sem erro.

**Manual:** executar os comandos de cada aplicação e confirmar que a API e a web exibem uma mensagem temporária de inicialização em portas distintas.

### T02 — Criar execução local e integração com VS Code — CONCLUÍDA

**Escopo:** criar `.vscode/tasks.json` e `.vscode/launch.json`. `Ctrl+Shift+B` inicia API e web em modo de desenvolvimento; `F5` inicia ou conecta o depurador Node.js da API e abre a web no navegador. Incluir tarefas de `lint`, `test`, `test:watch` e `build`.

**Automatizado:** validar o JSON das configurações e executar as tarefas de build, lint e teste pelo VS Code.

**Manual:** usar `Ctrl+Shift+B`, acessar API e web, colocar um breakpoint em uma rota de diagnóstico e iniciar `F5`; a execução deve pausar no breakpoint.

### T03 — Implementar configuração, logs e saúde da API — CONCLUÍDA

**Escopo:** carregar e validar `MONGODB_URI`, `SESSION_SECRET`, `NODE_ENV`, `HTTP_PORT`, `AUTOHOME_FIRMWARE_GEN1_DIR`, `OTA_MAX_CONCURRENCY` e `BOOTSTRAP_ADMIN_PASSWORD`. Implementar logs estruturados, `requestId`, resposta de erro padrão e `GET /api/v1/health`.

**Automatizado:** testar falha de início para variável obrigatória ausente, formato de erro e resposta de saúde sem expor segredo.

**Manual:** iniciar com `.env` válido, acessar `/api/v1/health` e remover temporariamente uma variável obrigatória para confirmar uma falha explicativa de início.

### T04 — Preparar MongoDB e persistência básica — CONCLUÍDA

**Escopo:** configurar conexão MongoDB, ciclo de vida da aplicação, banco de desenvolvimento local, banco isolado de teste e criação dos índices definidos em `dados.md`. Criar repositório base que converte `_id` interno em IDs públicos da API.

**Automatizado:** usar um banco de teste isolado na instância local configurada para verificar conexão, criação de índices e ausência de `_id` em uma resposta serializada.

**Manual:** iniciar a API com MongoDB local, confirmar a saúde com dependência disponível e inspecionar que os índices são criados no banco de desenvolvimento.

## Segurança e Auditoria

### T05 — Implementar usuários bootstrap, autenticação e sessão — CONCLUÍDA

**Escopo:** criar `users` e `sessions`, hash Argon2id, login, logout, consulta de sessão, alteração da própria senha e regras da conta bootstrap. Criar `admin` somente no banco vazio, usando `BOOTSTRAP_ADMIN_PASSWORD` quando definido; exigir troca antes de qualquer outra ação.

**Automatizado:** testar criação única do bootstrap, hash de senha, login válido e inválido, cookie de sessão, invalidação de sessão e bloqueio enquanto a troca obrigatória estiver pendente.

**Manual:** iniciar com banco vazio, entrar com `admin`, confirmar que as demais rotas são bloqueadas, trocar a senha, sair e entrar novamente com a nova senha.

### T06 — Implementar autorização e auditoria — CONCLUÍDA

**Escopo:** criar os papéis `basico` e `administrador`, middleware de autorização e `audit_logs`. Registrar autenticação, mudanças de usuários e toda mutação de domínio; não registrar segredos.

**Automatizado:** testar que `basico` recebe acesso negado em rota administrativa, que administrador é autorizado e que mutações criam auditoria sem senha, cookie ou token.

**Manual:** criar um usuário básico, entrar com ele, confirmar acesso aos recursos operacionais e bloqueio nos administrativos; entrar como administrador e localizar os eventos na auditoria.

### T07 — Implementar gestão administrativa de usuários — CONCLUÍDA

**Escopo:** implementar endpoints OpenAPI de lista, criação, alteração de papel, ativação, desativação e redefinição de senha. Impedir que a instalação fique sem administrador ativo.

**Automatizado:** testar usuário duplicado, troca de papel, desativação, redefinição que invalida sessões e proteção do último administrador ativo.

**Manual:** criar usuário básico, redefinir a senha, desativá-lo e confirmar que ele não consegue mais iniciar sessão.

## Contratos e Dados da Residência

### T08 — Publicar o primeiro contrato OpenAPI e gerar o cliente web — CONCLUÍDA

**Escopo:** criar a especificação OpenAPI para autenticação, saúde, usuário atual e erros. Gerar cliente TypeScript consumido pela web e validar que cada rota implementada corresponde ao contrato.

**Automatizado:** validar OpenAPI, executar teste de contrato das rotas e compilar o cliente gerado.

**Manual:** abrir a documentação OpenAPI local e usar uma requisição de login e `GET /me`; confirmar que a resposta segue o esquema publicado.

### T09 — Implementar áreas e cômodos — CONCLUÍDA

**Escopo:** criar coleções, índices, endpoints e validações para áreas e cômodos. Permitir área opcional, ordenação e operações administrativas de criar, renomear e excluir; impedir exclusão que deixe módulos vinculados sem tratamento explícito.

**Automatizado:** testar ordenação, vínculo de cômodo a área, validações e erro ao excluir recurso ainda referenciado.

**Manual:** como administrador, criar uma área e dois cômodos, reordená-los e tentar excluir uma área ainda em uso para verificar a mensagem de bloqueio.

### T10 — Criar a interface de transporte simulada — CONCLUÍDA

**Escopo:** definir a interface interna da central para descoberta, consulta de estado/hash, envio de comando, distribuição de configuração e OTA. Implementar adaptador em memória exclusivo para desenvolvimento e testes; não definir nem codificar protocolo de rede real.

**Automatizado:** testar eventos simulados de descoberta, estado, confirmação, indisponibilidade e falha de transferência.

**Manual:** iniciar a API em modo de desenvolvimento, inserir módulos simulados pelo mecanismo de desenvolvimento e observar logs de descoberta e estado.

### T11 — Implementar descoberta e adoção de módulos — CONCLUÍDA

**Escopo:** persistir módulos observados, expor filtros de descoberta, adotar módulo e criar inventário com identidade, família, capacidades, transporte e disponibilidade. Módulos sem adoção não são operáveis.

**Automatizado:** testar deduplicação por `protocolId`, filtros, adoção única e bloqueio de comando para módulo descoberto não cadastrado.

**Manual:** criar um módulo simulado, encontrá-lo em Descoberta, adotá-lo e confirmar que ele passa a aparecer em Módulos, ainda sem cômodo.

### T12 — Implementar detalhe, organização e configuração de módulos — CONCLUÍDA

**Escopo:** permitir nomear módulo, vinculá-lo opcionalmente a cômodo, consultar estado e alterar configurações declaradas. Persistir valores desejados, enviados e confirmados; validar tipos e capacidades. Implementar vínculos locais somente sobre a interface simulada.

**Automatizado:** testar vínculo de módulo a cômodo, rejeição de capacidade incompatível, transição desejada/enviada/confirmada e falha de sincronização.

**Manual:** vincular um módulo adotado a um cômodo, alterar um parâmetro suportado e observar os estados de sincronização até a confirmação simulada.

## Operação de Módulos

### T13 — Implementar comandos e estados em tempo real

**Escopo:** implementar `POST /commands`, consulta de comando, chave de idempotência, estados de comando e WebSocket autenticado. Publicar mudanças de estado, disponibilidade e comando; implementar reconexão por `eventId` ou reconciliação HTTP.

**Automatizado:** testar duplicação por chave de idempotência, confirmação e falha simuladas, autorização do usuário básico e recebimento de evento WebSocket autenticado.

**Manual:** enviar um comando a um módulo simulado, observar `aguardando` e `enviado`, confirmar mudança para `confirmado`; desligar o módulo simulado e confirmar `indisponivel`.

### T14 — Implementar repositório de firmware e reconciliação OTA

**Escopo:** ler diretório configurado por família, localizar `.bin`, calcular SHA-256, expor disponibilidade do firmware e solicitar hash atual aos módulos pela interface simulada. Não selecionar binário manualmente pela API.

**Automatizado:** testar diretório inválido, hash de arquivo, comparação atualizado/desatualizado/desconhecido e ausência de arquivos elegíveis.

**Manual:** configurar um diretório de teste com um `.bin`, iniciar a API, consultar OTA e confirmar que um módulo simulado com hash diferente aparece como atualização disponível.

### T15 — Implementar fila e acompanhamento de OTA

**Escopo:** criar `ota_jobs` e `ota_job_items`, iniciar atualização individual, por família e global, limitar concorrência e persistir os estados definidos em `ota.md`. Confirmar somente após o hash esperado retornar após reinício. Registrar auditoria por solicitação e por módulo.

**Automatizado:** testar limite de concorrência, isolamento de falha, sequência de estados, confirmação por hash, repetição somente de itens não confirmados e auditoria.

**Manual:** iniciar uma atualização em lote de módulos simulados, forçar falha em um deles e confirmar que os demais concluem, enquanto o item falho pode ser executado novamente.

## Interface Web

### T16 — Implementar fundação da web, login e sessão

**Escopo:** criar aplicação React com Vite, PWA responsiva, React Router, TanStack Query, Tailwind CSS e componentes acessíveis. Implementar login, logout, troca obrigatória de senha, proteção de rotas e cliente OpenAPI gerado.

**Automatizado:** testar guardas de rota, tela de troca obrigatória e tratamento de sessão expirada; executar build de produção.

**Manual:** abrir a web em desktop e celular, entrar com a conta bootstrap, trocar a senha, atualizar a página e confirmar que a sessão permanece válida; sair e confirmar redirecionamento ao login.

### T17 — Implementar operação por cômodos

**Escopo:** criar lista de cômodos e detalhe de cômodo, com controles derivados das capacidades, estados confirmados/pendentes/indisponíveis e atualizações WebSocket. Garantir que usuários básicos não vejam opções administrativas.

**Automatizado:** testar transformação de capacidades em controles, estado visual de comando e ocultação de navegação administrativa.

**Manual:** entrar como usuário básico, abrir um cômodo com módulo simulado, enviar uma comutação e observar a transição visual até a confirmação; verificar comportamento em largura de celular.

### T18 — Implementar administração de residência e módulos

**Escopo:** criar telas de Descoberta, Módulos, detalhe/configuração de módulo e Áreas e Cômodos. Incluir filtros, adoção, organização e acompanhamento de sincronização de configuração.

**Automatizado:** testar filtros, formulário de adoção, validações de vínculo e bloqueio de rotas para usuário básico.

**Manual:** como administrador, descobrir e adotar um módulo simulado, criar área e cômodo, vinculá-lo ao cômodo e alterar uma configuração suportada.

### T19 — Implementar OTA, usuários e auditoria na web

**Escopo:** criar telas administrativas de OTA, gestão de usuários e consulta de auditoria. OTA deve permitir ação individual, por família e global, com progresso por módulo e nova tentativa de itens falhos.

**Automatizado:** testar filtros de auditoria, ações administrativas de usuário, renderização dos estados de OTA e bloqueio de usuário básico.

**Manual:** criar usuário básico, iniciar OTA para módulos simulados, acompanhar o lote, forçar uma falha e consultar na auditoria os eventos da solicitação e do resultado.

## Qualidade e Integração

### T20 — Criar suíte E2E e pipeline de qualidade local

**Escopo:** adicionar testes E2E para autenticação, troca de senha, operações de cômodo, restrições de papel, descoberta, configuração, comandos e OTA usando o adaptador simulado. Criar comando único que execute lint, testes unitários, integração, contrato e E2E.

**Automatizado:** o comando de qualidade deve falhar quando qualquer camada falhar e passar em ambiente limpo com MongoDB de teste.

**Manual:** executar o comando único de qualidade e repetir o fluxo principal em navegador: bootstrap, criação de cômodo, adoção de módulo, comando confirmado e OTA confirmada.

### T21 — Integrar o adaptador ao protocolo compartilhado

**Pré-requisito:** contratos compartilhados de rede, payload, pareamento, estado, configuração e OTA aprovados em `docs/protocol.md` e no `gen1`.

**Escopo:** substituir somente o adaptador simulado pelo adaptador real, preservando os contratos HTTP, WebSocket, domínio e interface. Validar autenticação/integridade de mensagens e correlação entre comandos, estados e OTA.

**Automatizado:** testes de integração do adaptador com mensagens válidas, inválidas, duplicadas, indisponibilidade e confirmação de OTA por hash.

**Manual:** com um módulo `gen1` real, descobrir, adotar, vincular a um cômodo, enviar comando, alterar configuração e concluir uma OTA confirmada pelo hash.
