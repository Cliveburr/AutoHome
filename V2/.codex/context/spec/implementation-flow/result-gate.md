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

O orquestrador só avança com `SUCCESS` do planejador e implementador,
`SUCCESS` do testador com todos os comandos obrigatórios aprovados, e
`APPROVED` do revisor. Cada agente valida localmente os sete campos e o status
compatível com sua fase antes de responder. Campo ausente, artefato
incompatível, teste pendente ou evidência insuficiente é uma falha local de
processo: corrija o artefato/retorno automaticamente e revalide a fase, sem
pedir autorização ao usuário.

O revisor confere o plano, o diff, `test-results.md`, os critérios de aceite e
`git diff --check`. Ao aprovar, atualiza o marcador de conclusão da tarefa e
faz um commit somente com os arquivos da tarefa que diferirem do estado inicial
do Git. Alterações preexistentes ou alheias permanecem fora do commit.

Ao reprovar ou bloquear, o revisor escreve a causa e a sugestão de retomada em
`review.md`. O orquestrador inicia `autohome_repairer` automaticamente para
causas locais. O corretor lê o relatório, altera apenas o escopo apontado e
retorna a tarefa à fase afetada; ele nunca conclui ou commita a tarefa. O
orquestrador só pede direção para uma decisão material de planejamento ou uma
barreira externa sem solução local segura.
