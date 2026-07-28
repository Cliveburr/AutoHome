# Resultados, revisão e correção

Cada subagente devolve ao orquestrador:

```text
STATUS: SUCCESS | FAILED | BLOCKED | APPROVED | REJECTED
TASK: <identificador>
ARTIFACT: <caminho>
SUMMARY: <resultado curto>
VALIDATION: <comandos e resultados>
BLOCKER: <none ou bloqueio concreto>
NEXT: <próxima fase ou none>
```

O orquestrador só avança com `SUCCESS` do planejamento/implementação,
`SUCCESS` do testador com todos os comandos automatizados obrigatórios
aprovados, e `APPROVED` do revisor. Cada agente valida localmente os sete campos e o status
compatível com sua fase antes de responder. Campo ausente, artefato
incompatível, teste pendente ou evidência insuficiente é uma falha local de
processo: corrija o artefato/retorno automaticamente e revalide a fase, sem
pedir autorização ao usuário.

O resultado do tester deve conter explicitamente:

```text
AUTOMATED: PASS | FAIL
MANUAL: PASS | NOT_RUN | BLOCKED_EXTERNAL
```

`MANUAL=NOT_RUN` ou `MANUAL=BLOCKED_EXTERNAL` não impede `STATUS=SUCCESS` se
todos os comandos automatizados passaram e o usuário não pediu demonstração
manual. `BLOCKED_EXTERNAL` nunca aciona `autohome_repairer`.

O revisor confere o plano, o diff, `test-results.md`, os critérios de aceite,
remoções de testes existentes, baseline de formatação e `git diff --check`.
Falhas de formatação preexistentes são aceitas quando identificadas no
preflight e nenhum arquivo alterado permanece sem formatação. Ao aprovar,
atualiza o marcador de conclusão da tarefa e
faz um commit somente com os arquivos da tarefa que diferirem do estado inicial
do Git. Alterações preexistentes ou alheias permanecem fora do commit.

Ao reprovar, o revisor escreve a causa e a sugestão de retomada em `review.md`.
O orquestrador inicia no máximo um `autohome_repairer` por causa local. O
corretor lê o relatório, altera apenas o escopo apontado e retorna a tarefa à
fase afetada; ele nunca conclui ou commita a tarefa. Falhas ambientais são
registradas como `BLOCKED_EXTERNAL` e não geram reparo automático. O
orquestrador só pede direção para uma decisão material de planejamento ou uma
barreira externa sem solução segura.
