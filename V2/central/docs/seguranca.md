# Segurança e Acesso — Central

## Escopo

Cada instalação da central controla uma única residência. O acesso é por cadastro interno, sem e-mail, recuperação automática de senha ou modelo multi-residência.

## Papéis

A primeira versão tem somente dois papéis:

- `basico`: consulta o estado dos módulos e envia comandos operacionais permitidos por suas capacidades, como ligar, desligar, alterar intensidade ou acionar cenas.
- `administrador`: possui todas as permissões do papel `basico` e é o único autorizado a administrar a central.

Configurações de dispositivos, pareamento, vínculos diretos, ambientes, grupos, cenas, automações, agendamentos, atualizações OTA, usuários, sessões e consultas de auditoria são exclusivas do papel `administrador`.

## Conta Inicial

Quando o banco de dados estiver vazio, a central cria a conta inicial:

```text
usuario: admin
senha: admin
papel: administrador
```

A conta inicial exige troca de senha no primeiro acesso. Enquanto a senha inicial estiver ativa, a sessão só pode alterar a própria senha ou ser encerrada; nenhum comando ou ajuste administrativo é permitido. A conta bootstrap é criada apenas uma vez por instalação.

No primeiro início, a variável de ambiente `BOOTSTRAP_ADMIN_PASSWORD` pode substituir a senha inicial. Se ela não for definida, aplica-se a senha `admin` documentada acima.

## Autenticação e Sessões

- Usuários são criados, alterados, ativados, desativados e têm senhas redefinidas somente por administradores.
- Senhas são persistidas exclusivamente como hash Argon2id.
- A interface web usa sessões autenticadas por cookie `HttpOnly`, `Secure` sob HTTPS e `SameSite` apropriado. Esse cookie assinado é a única credencial das rotas HTTP e do WebSocket; não há Bearer token.
- Sessões devem poder ser invalidadas por um administrador e após redefinição de senha.
- MongoDB não é exposto publicamente; somente a central acessa o banco.

## Auditoria

A central persiste um registro de auditoria que não pode ser alterado pela interface. Cada registro inclui data e hora, usuário quando identificado, tipo e resultado da ação, alvo afetado, origem/IP, identificador da sessão e detalhes seguros.

Devem ser auditados, no mínimo:

- Logins, logouts e falhas de login.
- Criação, alteração, ativação, desativação e redefinição de senha de usuários.
- Envio, confirmação e falha de comandos aos módulos.
- Alterações administrativas em dispositivos, vínculos, ambientes, grupos, cenas, automações, agendamentos e atualizações OTA.

Senhas, hashes, cookies, tokens e outros segredos nunca são persistidos no log de auditoria.

O envio de comando registra ator, módulo, capacidade, ação, correlação e resultado seguro. A confirmação e falha/indisponibilidade registram a mesma correlação, sem parâmetros brutos, pacotes ou binários. Sessões que ainda exigem troca de senha são recusadas tanto em comandos quanto no handshake de tempo real.

## Exposição Futura

A API e a interface web podem ser expostas à internet em etapa futura. Essa exposição deve usar HTTPS, autenticação e autorização da central, sem acesso público direto ao MongoDB ou aos módulos.

Serviços futuros que precisem de acesso delegado, como mídia, usam tokens assinados, de curta duração e com escopo limitado ao recurso autorizado.
