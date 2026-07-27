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
4. Em qualquer resultado diferente de sucesso válido, preserve o workspace e
   classifique a causa. Para falha local de código, teste, artefato, validação
   ou revisão, inicie `autohome_repairer` automaticamente, retorne à primeira
   fase afetada e só avance após resultado válido. Pare para intervenção humana
   apenas se o planejamento encontrar decisão material/ambiguidade ou se houver
   barreira externa sem solução local segura; não solicite confirmações de
   reteste, reparo, marcador ou commit.

O planejador deve ler a documentação da área: para a Central, comece por
[`implementacao.md`](../../../../central/docs/implementacao.md) e
[`readme.md`](../../../../central/docs/readme.md). Quando o pedido não indicar
a área, o seletor deve bloquear e pedir esclarecimento.

Cada prompt de subagente deve conter o identificador da tarefa, o diretório de
artefatos, o estado inicial do Git e a exigência de validar o status definido
em [`result-gate.md`](result-gate.md) antes de responder. Para testes que
executem teardown destrutivo, o prompt também exige comprovar banco local
isolado antes de qualquer exclusão.
