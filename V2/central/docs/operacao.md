# Operação — Central

## Configuração

Configurações de ambiente não são codificadas no projeto. A instalação fornece, no mínimo:

```text
MONGODB_URI=
SESSION_SECRET=
NODE_ENV=
HTTP_PORT=
AUTOHOME_FIRMWARE_GEN1_DIR=
OTA_MAX_CONCURRENCY=
BOOTSTRAP_ADMIN_PASSWORD=
```

`BOOTSTRAP_ADMIN_PASSWORD` aplica-se somente à criação inicial quando ainda não há usuários. Se não for definido, a central cria `admin` com senha `admin` e exige troca no primeiro acesso, conforme `seguranca.md`.

## Inicialização

No início, a central valida conexão com MongoDB, segredo de sessão, diretórios de firmware configurados e valores de concorrência OTA. Falhas nessas dependências devem impedir a central de anunciar disponibilidade operacional.

A central cria a conta bootstrap apenas uma vez, quando o banco não possui usuários. Não recria nem redefine essa conta em inícios posteriores.

## Saúde e Logs

O endpoint de saúde informa se a API está em execução e se dependências essenciais estão disponíveis, sem expor segredos, inventário ou dados de usuários.

Logs técnicos são estruturados e incluem data/hora, nível, componente, `requestId` ou correlação quando houver e descrição segura. Logs técnicos não substituem auditoria e não podem conter senhas, cookies, tokens ou binários.

## Persistência

A operação da instalação deve prever backup e restauração do MongoDB. Um backup preserva inventário, configurações, usuários, auditoria, comandos e histórico de OTA. Binários de firmware são geridos nos diretórios configurados e não fazem parte do banco.

## Exposição Futura

Quando API e interface forem expostas à internet, a instalação exige HTTPS e cookies seguros. MongoDB permanece privado e acessível somente pela central. A exposição pública não permite acesso direto a módulos nem ao repositório de firmware.