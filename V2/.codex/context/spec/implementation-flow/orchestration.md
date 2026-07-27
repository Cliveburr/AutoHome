# Orquestração do fluxo de implementação

O orquestrador resolve a solicitação e controla a sequência. Não implementa,
testa ou revisa em paralelo com qualquer subagente.

1. Inicie um sub-agent `default` com o modelo e esforço do perfil
   `autohome_task_selector`. Ele identifica Central ou firmware Gen1, resolve
   uma ou duas tarefas inacabadas na ordem oficial e registra o estado inicial
   do Git de cada tarefa.
2. Para cada tarefa resolvida, inicie e aguarde, nesta ordem:
   sub-agents `default` com as instruções equivalentes a
   `autohome_planner`, `autohome_implementer`, `autohome_tester` e
   `autohome_reviewer`, usando os parâmetros correspondentes da matriz abaixo.
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

## Matriz de execução

O runtime aceita a seleção quando `model` e `reasoning_effort` são enviados
como campos da chamada de `spawn_agent`. A interface pode exibir `low` como
“Light”. Use estes valores:

| Fase | Instruções do perfil | Modelo | Esforço |
| --- | --- | --- | --- |
| Seleção | `autohome_task_selector` | `gpt-5.6-luna` | `low` |
| Planejamento | `autohome_planner` | `gpt-5.6-terra` | `medium` |
| Implementação | `autohome_implementer` | `gpt-5.6-terra` | `high` |
| Testes | `autohome_tester` | `gpt-5.6-luna` | `low` |
| Revisão | `autohome_reviewer` | `gpt-5.6-sol` | `high` |
| Correção | `autohome_repairer` | `gpt-5.6-terra` | `high` |

O prompt deve incorporar as `developer_instructions` do perfil indicado e os
requisitos específicos desta orquestração. O nome do perfil no prompt não
altera o runtime; somente `agent_type`, `model` e `reasoning_effort` enviados
na chamada fazem isso. Após cada inicialização, confirme no app que o modelo e
o esforço exibidos correspondem à matriz antes de aceitar o resultado.

Cada prompt de subagente deve conter o identificador da tarefa, o diretório de
artefatos, o estado inicial do Git e a exigência de validar o status definido
em [`result-gate.md`](result-gate.md) antes de responder. Para testes que
executem teardown destrutivo, o prompt também exige comprovar banco local
isolado antes de qualquer exclusão.
