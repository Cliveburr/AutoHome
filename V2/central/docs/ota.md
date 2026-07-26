# Atualização OTA — Central

## Escopo

A central coordena atualizações OTA de módulos cadastrados. A primeira versão suporta a família `gen1` e permite a inclusão de outras famílias sem alterar o fluxo.

Somente usuários com o papel `administrador` podem consultar, iniciar ou acompanhar atualizações OTA.

## Repositório Local de Firmware

Os binários são arquivos `.bin` em diretórios locais da central. Cada diretório é configurado por variável de ambiente para sua família de módulo:

```text
AUTOHOME_FIRMWARE_GEN1_DIR=/dados/autohome/firmwares/gen1
```

A central só considera arquivos presentes no diretório configurado. Esse diretório é uma fonte local confiável e seu acesso deve ser restrito ao operador da central.

## Identidade do Firmware

A central calcula o hash SHA-256 de cada arquivo `.bin` encontrado. O hash é a identidade e o critério de comparação do firmware.

Um módulo informa o hash SHA-256 do firmware em execução quando responde a uma consulta de estado ou diagnóstico. Para um módulo de uma família compatível:

```text
hash do binário local = hash informado pelo módulo  -> atualizado
hash do binário local != hash informado pelo módulo -> atualização disponível
sem resposta ou hash ausente                         -> versão desconhecida ou indisponível
```

Uma versão textual pode ser exibida para consulta, mas não determina se uma atualização é necessária e não substitui o hash.

O protocolo OTA deve transportar o hash SHA-256 esperado. O módulo valida o binário recebido contra esse hash antes de aplicá-lo e o informa novamente após reiniciar.

## Operação

A área OTA é acessada a partir da página de módulos e organiza os módulos por família de firmware. Ela permite:

- Solicitar novamente o hash atual de um ou mais módulos.
- Atualizar um módulo individual com o binário atual de sua família.
- Atualizar todos os módulos desatualizados de uma família, como `gen1`.
- Atualizar todos os módulos elegíveis da residência.
- Acompanhar individualmente o resultado de uma atualização em lote.

Ao iniciar uma atualização, a central seleciona o binário disponível para a família do módulo, registra o hash esperado e inicia a transferência sem exigir seleção manual de arquivo pela interface.

## Estados

Cada execução individual de OTA tem um dos seguintes estados:

- `aguardando`: entrou na fila e ainda não iniciou.
- `enviando`: binário em transferência para o módulo.
- `validando`: módulo valida o binário recebido.
- `reiniciando`: módulo aplica o firmware e reinicia.
- `confirmado`: o módulo retornou após reiniciar e informou o hash esperado.
- `falhou`: a transferência, validação, aplicação ou confirmação falhou.
- `indisponivel`: o módulo não respondeu ou ficou inacessível durante a execução.

O estado `confirmado` só é atribuído depois que a central receber o hash esperado do módulo após o reinício. Uma transferência concluída não é confirmação de atualização aplicada.

## Lotes e Falhas

Atualizações em massa são executadas em fila, em lotes pequenos. A quantidade máxima simultânea é configurável pela central para não saturar Wi-Fi, ponte ou Mesh.

Uma falha ou indisponibilidade afeta apenas o módulo correspondente; os demais itens elegíveis do lote continuam. A central registra o progresso e permite executar novamente apenas os módulos que não foram confirmados.

## Auditoria

Cada solicitação de OTA e o resultado de cada módulo são registrados na auditoria, incluindo usuário, módulo, família, hash esperado, resultado, data e hora. O log não armazena o binário nem segredos.

## Evolução de Segurança

O hash detecta divergência e corrupção de arquivo ou transferência. Caso a distribuição de firmware deixe de ser restrita ao repositório local controlado, os binários devem passar a incluir assinatura criptográfica verificável pelo módulo, sem substituir a comparação por hash.