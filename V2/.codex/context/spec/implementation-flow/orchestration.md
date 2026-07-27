# Orquestração do fluxo de implementação

O orquestrador resolve a solicitação e controla a sequência. Não implementa,
testa ou revisa em paralelo com qualquer subagente.

1. Inicie `autohome_task_selector`. Ele identifica Central ou firmware Gen1,
   resolve uma ou duas tarefas inacabadas na ordem oficial e registra o estado
   inicial do Git de cada tarefa.
2. Para cada tarefa resolvida, inicie e aguarde, nesta ordem:
   `autohome_planner`, `autohome_implementer`, `autohome_tester` e
   `autohome_reviewer`.
3. Só inicie a segunda tarefa depois que a primeira tiver sido aprovada e
   commitada pelo revisor.
4. Em qualquer resultado diferente de sucesso válido, interrompa o fluxo,
   preserve o workspace e reporte a fronteira de falha. Não inicie a segunda
   tarefa nem o corretor automaticamente.

O planejador deve ler a documentação da área: para a Central, comece por
[`implementacao.md`](../../../../central/docs/implementacao.md) e
[`readme.md`](../../../../central/docs/readme.md). Quando o pedido não indicar
a área, o seletor deve bloquear e pedir esclarecimento.

Cada prompt de subagente deve conter o identificador da tarefa, o diretório de
artefatos, o estado inicial do Git e a exigência de retornar o status definido
em [`result-gate.md`](result-gate.md).
