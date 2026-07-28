# Orquestração do fluxo de implementação

O orquestrador resolve a solicitação e controla a sequência. Não implementa,
testa ou revisa em paralelo com qualquer subagente.

1. Faça um preflight leve no workspace: registre HEAD, status, package manager,
   baseline de formatação e contagem de testes existentes. Verifique também se
   há múltiplas cópias físicas de React ou outra dependência crítica.
2. Se o pedido já identificar a área e a próxima tarefa, não inicie
   `autohome_task_selector`. Caso contrário, use-o uma única vez.
3. Inicie `autohome_planner` para materializar o plano e validar que cada
   critério de aceite é suportado pelas APIs, permissões e contratos existentes.
   Para uma tarefa clara, o mesmo agente pode continuar como implementador; não
   repita a leitura integral do repositório em um novo agente.
4. Execute os testes automatizados em um único `autohome_tester`. O tester deve
   separar falhas de produto de falhas ambientais e não iniciar reparo por
   `BLOCKED_EXTERNAL`.
5. Inicie `autohome_reviewer` somente após os testes automatizados. O revisor
   deve verificar remoções de testes existentes, arquivos fora do escopo,
   baseline de formatação e `git diff --check` antes de aprovar.
6. Para uma causa local, use no máximo um `autohome_repairer`; depois retorne
   diretamente à fase afetada. Não crie `review.md` como pré-requisito do
   reparo: ele é obrigatório quando a revisão reprova ou quando o orquestrador
   precisa registrar a causa de retomada.
7. Só inicie a segunda tarefa depois que a primeira tiver sido aprovada e
   commitada pelo revisor.

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
em [`result-gate.md`](result-gate.md) antes de responder. As instruções
canônicas de artefatos e gates ficam em `.codex/context/spec/implementation-flow/`;
não exija cópias desses documentos dentro do diretório temporário da tarefa.
Para testes que executem teardown destrutivo, o prompt também exige comprovar
banco local isolado antes de qualquer exclusão.

O tester deve registrar duas seções independentes:

- `AUTOMATED`: todos os comandos que podem bloquear o commit;
- `MANUAL`: `PASS`, `NOT_RUN` ou `BLOCKED_EXTERNAL`, sem iniciar reparo de
  código quando o bloqueio for ambiental.

Antes de aprovar, o revisor deve comparar os arquivos de teste com o HEAD
inicial. Remoções de testes existentes exigem justificativa explícita no plano;
caso contrário, são regressão e reprovação.
