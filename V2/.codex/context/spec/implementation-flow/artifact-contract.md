# Contrato de artefatos temporários

Use `.codex/runtime/implementation-flow/<run-id>/<task-id>/`. O diretório é
ignorado pelo Git e não é uma fonte de verdade persistente.

Antes de iniciar o planejamento de uma tarefa, `autohome_planner` remove apenas
o diretório `<task-id>` daquela execução e o recria. Não remova diretórios de
outras tarefas nem de outras execuções.

Os artefatos obrigatórios são:

- `plan.md`: tarefa, estado inicial do Git, escopo, arquivos previstos,
  critérios de aceite, restrições, mudanças documentais e comandos de teste.
  Quando houver teardown destrutivo de banco, também identifica o mecanismo de
  isolamento, a validação do alvo antes da exclusão e a garantia de término do
  trabalho assíncrono antes do teardown.
- `implementation.md`: arquivos alterados, decisões de implementação, desvios
  aprovados do plano e validações exploratórias executadas.
- `test-results.md`: comando, resultado, evidência resumida, duração quando
  disponível e status final dos testes.
- `review.md`: decisão, evidências verificadas, arquivos autorizados para o
  commit, hash do commit quando aprovado ou relatório de falha quando negado.

Todo artefato deve identificar `run-id`, `task-id`, `HEAD` inicial e seu autor.
O implementador e o testador devem parar se `plan.md` estiver ausente ou for de
outra tarefa ou execução.
