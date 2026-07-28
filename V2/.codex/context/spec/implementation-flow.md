# Fluxo de implementação

Execute este procedimento de ponta a ponta. Não encerre o trabalho após
apresentar o plano.

Prossiga autonomamente por todas as etapas. A intervenção humana ocorre somente
no planejamento, quando houver uma decisão material, ambígua ou incerta que não
possa ser resolvida pela documentação e pelo contexto disponíveis. A criação da
tarefa já autoriza as mutações normais de implementação, teste, reteste,
documentação de entrega, marcador de conclusão e commit isolado; respostas como
`sim` ou `autorizo` nunca são pré-requisito do fluxo. Esta regra não substitui
nem contorna controles obrigatórios de segurança da plataforma.

Durante a fase atual de desenvolvimento, não introduza compatibilidade
retroativa, caminhos legados ou preservação de comportamento antigo, salvo
solicitação explícita do usuário.

## Limite e sequência

- Sem limite explícito, implemente somente a próxima tarefa inacabada.
- Quando o usuário pedir duas tarefas, resolva as duas primeiras tarefas
  inacabadas em ordem.
- Execute um único subagente por vez, mas não crie um agente separado para cada
  etapa quando a tarefa já identifica a área e a próxima entrega. Nesse caso,
  use: preflight, planejamento/implementação, testes automatizados e revisão.
- Pule o seletor quando o pedido já disser explicitamente “próxima tarefa da
  Central” ou identificar a tarefa. Use o planejador somente para resolver
  escopo, dependências e critérios de aceite.
- Preserve alterações parciais. Para uma falha local, permita no máximo uma
  correção por causa identificada e retorne diretamente à fase afetada. Não
  reabra a mesma cadeia de agentes sem evidência nova.
- Classifique falhas de ambiente (`ENOMEM`, processo não iniciado, navegador
  indisponível, permissão do sistema ou rede) como `BLOCKED_EXTERNAL`. Elas não
  autorizam alterações de produto nem loops de reparo.

## Orquestração

O orquestrador usa as instruções dos perfis `autohome_planner`,
`autohome_implementer`, `autohome_tester` e `autohome_reviewer`, mas inicia cada
sub-agent como `default` para poder transmitir modelo e esforço individualmente.
Para cada tarefa, a ordem normal é: preflight, planejamento/implementação,
testes automatizados, revisão e commit. O perfil `autohome_task_selector` é
opcional quando a tarefa já foi identificada. O perfil `autohome_repairer` é
acionado no máximo uma vez por causa local e permanece limitado ao bloqueio
registrado.

Cada chamada deve preencher explicitamente os campos `model` e
`reasoning_effort` do `spawn_agent` conforme a matriz em
`implementation-flow/orchestration.md`. Não dependa da herança do
orquestrador nem coloque esses parâmetros somente no prompt.

O planejador atua em modo Plan: analisa o repositório sem modificar arquivos do
projeto e materializa o plano temporário. O implementador lê esse plano; o
testador executa a estratégia de teste registrada; e o revisor decide se a
tarefa pode ser concluída e receber commit.

Antes de entregar a implementação, o implementador deve executar toda geração
de código prevista no plano, formatar os arquivos gerados e confirmar
`format:check`. Essa pré-checagem evita que saída gerada fora do padrão de
formatação chegue à fase de testes independentes.

Os artefatos temporários ficam em `.codex/runtime/implementation-flow/` e não
podem entrar no Git. Antes de planejar uma tarefa, o planejador remove apenas o
diretório temporário daquela tarefa e cria os novos artefatos.

## Encerramento

O revisor só marca a tarefa como concluída e cria o commit quando o plano, a
implementação, os testes automatizados e a revisão estiverem aprovados. A
validação manual é informativa por padrão: registre `PASS`, `NOT_RUN` ou
`BLOCKED_EXTERNAL`, mas não bloqueie o commit por indisponibilidade do
ambiente. Só torne a validação manual obrigatória quando o usuário pedir
explicitamente uma demonstração ou inspeção visual.

Ao encerrar, informe
as tarefas concluídas, a tarefa atual ou interrompida, o motivo da parada, as
validações executadas e como retomar, quando aplicável.

<Progressive_Disclosure>
<ImplementationOrchestration>
Quando for necessário executar, delegar ou retomar o fluxo, leia
[`orchestration.md`](implementation-flow/orchestration.md).
</ImplementationOrchestration>
<ImplementationArtifacts>
Quando for necessário criar, ler ou validar os artefatos temporários, leia
[`artifact-contract.md`](implementation-flow/artifact-contract.md).
</ImplementationArtifacts>
<ImplementationResultGate>
Quando uma fase terminar, falhar, bloquear ou chegar ao commit, leia
[`result-gate.md`](implementation-flow/result-gate.md).
</ImplementationResultGate>
</Progressive_Disclosure>
