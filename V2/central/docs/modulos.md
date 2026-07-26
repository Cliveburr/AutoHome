# Módulos — Central

## Ciclo de Vida

Um módulo pode estar nos seguintes estados de inventário:

- `descoberto`: foi observado pela central, mas ainda não foi adotado.
- `cadastrado`: foi adotado pela residência e possui configurações administrativas.
- `online`: cadastrado e com comunicação recente confirmada.
- `offline`: cadastrado, mas sem comunicação dentro do limite de disponibilidade.
- `erro`: cadastrado e com falha administrativa, de configuração ou de protocolo identificada.

`online`, `offline` e `erro` descrevem a condição atual de um módulo cadastrado. Um módulo descoberto só passa a integrar o inventário depois de uma ação de adoção realizada por administrador.

## Inventário

Cada módulo cadastrado mantém:

- Identidade de protocolo imutável e legível.
- Família de firmware, inicialmente `gen1`.
- Capacidades e transporte anunciados pelo módulo.
- Nome administrativo, área e cômodo opcionais.
- Endereço ou rota atual resolvida pela central.
- Última comunicação, disponibilidade e estado confirmado.

Capacidades, transporte e identidade são informações recebidas do módulo. Nome e organização da residência são informações administradas pela central.

## Configuração

Cada configuração tem três representações:

- `desejada`: valor salvo pelo administrador na central.
- `enviada`: valor encaminhado ao módulo e ainda sem confirmação.
- `confirmada`: valor reconhecido pelo módulo em sua resposta de estado ou configuração.

Uma divergência entre configuração desejada e confirmada é apresentada como pendente ou falha de sincronização. A central não altera a configuração confirmada sem resposta válida do módulo.

Parâmetros e formulários são definidos pelas capacidades anunciadas. A central valida tipos, limites e compatibilidade de destino antes de enviar uma alteração.

## Vínculos Locais

Um vínculo define que um evento de uma capacidade de origem solicita uma ação em uma capacidade de destino. Exemplos incluem um `switch` que solicita `toggle` ou `set` em um relé.

Cada vínculo contém origem, evento, destino, ação e parâmetros necessários. Origem e destino precisam ser capacidades compatíveis, e o vínculo é enviado aos módulos envolvidos conforme o protocolo compartilhado.

A configuração de vínculos é exclusiva de administradores e deve ter confirmação explícita dos módulos antes de ser considerada aplicada.

## Comandos Operacionais

Usuários `basico` e `administrador` podem enviar comandos operacionais para capacidades de módulos cadastrados. A central registra a solicitação, encaminha o comando, acompanha a confirmação e publica o resultado para a interface.

Configurações, adoção, organização, vínculos e diagnósticos administrativos são exclusivos de administradores.