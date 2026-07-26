# Contexto progressivo

## Objetivo

Contexto progressivo mantém no contexto apenas indicações curtas das informações
disponíveis. O conteúdo completo é carregado somente quando a tarefa o exigir.

## Estrutura da informação

Toda informação possui duas partes:

- **Header:** indicação curta presente no contexto atual. Informa somente quando
  o body deve ser lido e aponta para ele.
- **Body:** conteúdo completo da informação. Só deve ser carregado se a tarefa
  corresponder à situação indicada pelo header.

## Formato do header

Use uma tag HTML com um nome que identifique a informação:

```html
<NomeDaInformacao>
Quando esta informação for necessária, leia
[`arquivo-do-body.md`](caminho/arquivo-do-body.md).
</NomeDaInformacao>
```

O header deve ser curto. Não explique o mecanismo, não resuma o body e não
inclua regras, procedimentos, exemplos ou contexto adicional.

## Como funciona

1. O LLM recebe os headers do nível atual.
2. Ele identifica os headers cuja situação de uso corresponde à tarefa.
3. Ele carrega somente os bodies apontados por esses headers.
4. Cada body pode fornecer a informação completa e revelar novos headers.
5. O LLM repete o processo até ter contexto suficiente para executar a tarefa.

O header informa a possibilidade de aprofundamento; o body entrega o
aprofundamento apenas quando necessário.

## Novos níveis de contexto

Um body pode conter uma seção `<Progressive_Disclosure>` com headers de novos
contextos progressivos. Essa seção revela somente novas possibilidades de
aprofundamento; ela não inclui os conteúdos dos respectivos bodies.

```html
<Progressive_Disclosure>
<MongoDBMigrations>
Quando a tarefa alterar coleções, índices ou documentos MongoDB, leia
[`mongodb-migrations.md`](mongodb-migrations.md).
</MongoDBMigrations>

<MigrationTests>
Quando a tarefa alterar ou validar migrações, leia
[`migration-tests.md`](migration-tests.md).
</MigrationTests>
</Progressive_Disclosure>
```

Os headers revelados nessa seção passam a ser os headers disponíveis no próximo
nível. Seus bodies continuam sob demanda.

## Exemplo completo

No `AGENTS.md`, o contexto inicial pode conter:

```html
<Progressive_Disclosure>
<PlanAndExec>
Quando o usuário pedir para implementar a próxima tarefa, leia e siga
[`plan-and-exec.md`](.agents/commands/plan-and-exec.md).
</PlanAndExec>
</Progressive_Disclosure>
```

Quando a solicitação for implementar a próxima tarefa, o LLM lê o body
`plan-and-exec.md`. Esse body pode ter a seguinte seção ao final:

```html
<Progressive_Disclosure>
<VisionAndRequirements>
Quando for necessário entender a visão e os requisitos da tarefa, leia
[`01-visao-e-requisitos.md`](../../docs/01-visao-e-requisitos.md).
</VisionAndRequirements>

<ImplementationSequence>
Quando for necessário identificar a próxima tarefa ou seu marco, leia
[`07-sequencia-de-implementacao.md`](../../docs/07-sequencia-de-implementacao.md).
</ImplementationSequence>
</Progressive_Disclosure>
```

O LLM lê apenas os documentos exigidos pela tarefa. Depois de identificar o
marco, o body daquele marco pode revelar headers para o ADR, contrato e fixture
relevantes.

## Manutenção de headers

O mesmo header pode aparecer em um ou mais arquivos para disponibilizar a mesma
informação em diferentes níveis ou caminhos de contexto.

Antes de criar, editar, renomear ou remover um header, pesquise o repositório
inteiro pelo nome da tag e pelo caminho do body correspondente.

Atualize todas as ocorrências que representem a mesma informação. Não deixe
headers duplicados com nomes, condições de uso ou caminhos divergentes.