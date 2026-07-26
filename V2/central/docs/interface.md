# Interface Web — Central

## Escopo

A interface web é uma aplicação React responsiva, com uso prioritário em celular para operação cotidiana e suporte completo a desktop para administração. Ela consome a API da central e recebe atualizações em tempo real pelo canal definido em `api.md`.

Estados de módulos, comandos e atualizações OTA devem aparecer como `confirmado`, `pendente` ou `indisponivel`. A interface não apresenta um comando como concluído antes da confirmação do módulo.

## Navegação

A navegação divide-se em operação e administração:

```text
Operação
├── Cômodos
└── Cômodo

Administração
├── Descoberta
├── Módulos
├── Áreas e cômodos
├── OTA
├── Usuários
└── Auditoria
```

O papel `basico` acessa somente Operação. O papel `administrador` acessa Operação e Administração.

Em celular, a entrada principal é Cômodos, com navegação inferior para Operação e, para administradores, Administração. Em desktop, a mesma estrutura é apresentada em menu lateral.

## Operação

### Cômodos

A página inicial exibe os cômodos cadastrados, agrupados por área quando houver áreas. Cada cômodo apresenta resumo de capacidades, luzes ou relés ativos, alertas e módulos indisponíveis.

Módulos sem vínculo a um cômodo não aparecem nesta área. Eles permanecem acessíveis para administradores na página de Módulos até serem organizados.

### Cômodo

Ao abrir um cômodo, a interface apresenta controles derivados das capacidades dos módulos vinculados. Relés e luzes usam controles grandes e diretos; intensidade, cor, sensores e outras funções aparecem somente quando suportados.

Os controles são agrupados pela função apresentada ao morador, e não por identificadores técnicos, marca ou transporte do módulo.

## Administração

### Descoberta

Lista módulos detectados pela central, com filtros por situação de cadastro, disponibilidade, família, capacidade e transporte. Permite buscar por nome provisório ou identificador, adotar o módulo encontrado e abrir seu detalhe.

Módulos descobertos não podem ser operados na área de cômodos até serem adotados e vinculados a um cômodo.

### Módulos

Lista os módulos cadastrados e permite abrir seu detalhe. O detalhe apresenta identidade, família, capacidades, transporte, conectividade, último estado confirmado, eventos recentes e diagnóstico.

As configurações são declaradas pelas capacidades do módulo. A interface permite alterar parâmetros compatíveis e configurar vínculos locais, como fazer o acionamento de um `switch` enviar uma comutação a um módulo de controle. Para cada alteração, exibe a configuração desejada, o estado de sincronização e a confirmação do módulo.

A área OTA é acessada a partir da página de Módulos, conforme `ota.md`.

### Áreas e Cômodos

Permite criar, renomear, ordenar e excluir áreas e cômodos. Também permite vincular e remover módulos dos cômodos. Um módulo pertence a no máximo um cômodo na primeira versão.

Áreas organizam a residência; cômodos são a unidade de operação.

### Usuários e Auditoria

Usuários permite criar, alterar papel, ativar, desativar e redefinir senhas. Auditoria permite consulta somente para administradores, com filtros por período, usuário, ação, resultado e alvo.

## Fora do Escopo Inicial

Automações, agendamentos, cenas globais, histórico de sensores e telemetria avançada não recebem páginas próprias no MVP. Quando implementados, entram em Administração sem alterar a divisão entre Operação e Administração.