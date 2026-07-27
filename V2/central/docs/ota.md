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

## Fila persistida

`ota_jobs` registra a solicitação administrativa e `ota_job_items` fixa, para cada módulo, a família, o SHA-256 esperado e uma correlação interna. A API recebe somente o escopo (`module`, `family` ou `all`) e identificadores públicos; nunca recebe caminho, arquivo ou binário. O artefato é relido do diretório configurado pelo SHA-256 imediatamente antes do envio e uma ausência posterior falha apenas aquele item.

Somente módulos adotados com hash atual conhecido e diferente do artefato local da família entram em uma solicitação nova. `OTA_MAX_CONCURRENCY` é o teto global de transferências ativas do processo: itens permanecem em `aguardando` e uma vaga é liberada tanto por confirmação como por falha ou indisponibilidade. A execução não tenta recuperar automaticamente itens que estavam ativos quando o processo foi reiniciado.

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

As transições e seus horários são persistidos. Após a confirmação de transferência, a central passa por `validando` e `reiniciando`, consulta novamente o hash e só então marca `confirmado`; hash divergente é `falhou` e módulo inacessível é `indisponivel`.

## Lotes e Falhas

Atualizações em massa são executadas em fila, em lotes pequenos. A quantidade máxima simultânea é configurável pela central para não saturar Wi-Fi, ponte ou Mesh.

Uma falha ou indisponibilidade afeta apenas o módulo correspondente; os demais itens elegíveis do lote continuam. A central registra o progresso e permite executar novamente apenas os módulos que não foram confirmados.

O retry cria outro job ligado ao job de origem, preserva o histórico e agenda exclusivamente itens cujo resultado anterior não foi `confirmado`.

## Auditoria

Cada solicitação de OTA e o resultado de cada módulo são registrados na auditoria, incluindo usuário, módulo, família, hash esperado, resultado, data e hora. O log não armazena o binário nem segredos.

O SHA-256 operacional do firmware é registrado explicitamente como `firmwareSha256`; hashes de credenciais continuam removidos pela sanitização de auditoria.

## Evolução de Segurança

O hash detecta divergência e corrupção de arquivo ou transferência. Caso a distribuição de firmware deixe de ser restrita ao repositório local controlado, os binários devem passar a incluir assinatura criptográfica verificável pelo módulo, sem substituir a comparação por hash.
