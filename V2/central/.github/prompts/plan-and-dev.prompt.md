---
name: plan-and-dev
description: Describe when to use this prompt
---

# Planejar e executar a próxima tarefa

Execute este procedimento de ponta a ponta. Não encerre o trabalho após apresentar o plano.

Durante a fase atual de desenvolvimento, não introduza compatibilidade retroativa,
caminhos legados ou preservação de comportamento antigo, salvo solicitação explícita
do usuário.

1. Identifique a primeira tarefa ainda não concluída na sequência no documento [implementacao.md](../../docs/implementacao.md). Então leia o documento em [readme.md](../../docs/readme.md) e a partir dela leia a documentação seguinte que achar necessário para executar a tarefa.
3. Use o modo Plan para analisar a implementação: identifique os arquivos envolvidos,
   defina a estratégia e registre critérios de aceite verificáveis.
4. Em seguida, implemente a solução completa. Preserve APIs públicas existentes e  mantenha a alteração restrita ao escopo da tarefa.
5. Adicione ou atualize os testes apropriados. Execute lint, testes e demais validações relevantes do repositório.
6. Revise o diff final para confirmar que ele atende aos critérios de aceite, não introduz regressões aparentes e não inclui mudanças alheias à tarefa.
7. Após todas as validações passarem, marque a tarefa como concluída em [implementacao.md](../../docs/implementacao.md) de forma bem clara.
8. Se os testes finais passarem e a revisão não encontrar problemas, inclua todas as alterações pendentes no commit e faça o commit imediatamente com o identificador e nome da tarefa atual.

Se na etapa do plan houver bloqueio real que impeça a implementação, apresente as evidências e o próximo passo necessário com sugestões de solução; caso contrário, prossiga autonomamente até concluir a
tarefa.