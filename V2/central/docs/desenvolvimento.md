# Desenvolvimento — Central

Execute os comandos a partir de `central/`. As dependências devem estar
instaladas com `npm install` antes do primeiro uso.

## Subir os serviços

O comando recomendado para desenvolvimento local é:

```text
npm run dev
```

Ele sobe API e Web juntos, ambos com recarga automática:

- API: `http://127.0.0.1:3000` — `tsx watch` reinicia a API quando arquivos
  TypeScript mudam.
- Web: `http://127.0.0.1:5173` — Vite aplica HMR na interface.

Para testar a partir de outro dispositivo da rede local:

```text
npm run dev:lan
```

Esse comando usa os mesmos watches/HMR, mas publica os dois serviços em
`0.0.0.0`. Acesse o Web pelo IP da máquina na porta `5173`; a API usa a porta
`3000`. Não use esse modo para exposição à internet.

Em qualquer modo, interrompa com `Ctrl+C`. Se o processo principal tiver sido
fechado sem encerrar os workers, limpe a execução registrada com:

```text
npm run dev:stop
```

## Executar apenas um serviço

Quando não for necessário subir a stack inteira, use os scripts do workspace:

```text
npm run dev --workspace @autohome/api
npm run dev --workspace @autohome/web
```

O primeiro inicia somente a API com watch; o segundo inicia somente o Web com
HMR. Esses comandos são locais e não substituem `npm run dev` quando a tarefa
precisa dos dois serviços.

## Propósito dos scripts da raiz

- `dev`: stack local API + Web com hot reload.
- `dev:lan`: stack API + Web acessível na rede local, também com hot reload.
- `dev:stop`: encerra a stack LAN/local registrada pelos scripts de
  desenvolvimento.
- `build`: compila todos os workspaces para produção.
- `production:prepare`: executa o build de produção da Central.
- `test`: executa os testes dos workspaces.
- `lint`: verifica lint de API e Web.
- `format` / `format:check`: formata ou verifica a formatação dos fontes e
  scripts da Central.
- `openapi:validate`: valida o contrato OpenAPI.
- `generate:api`: regenera o cliente TypeScript do Web a partir do OpenAPI.

Os scripts de cada workspace (`api/package.json` e `web/package.json`) são
deliberadamente mais específicos: `api dev` usa watch do servidor e `web dev`
usa HMR do Vite; `build`, `lint`, `typecheck` e `test` executam a verificação
correspondente somente naquele workspace.

## Validação manual

Depois que `npm run dev` informar que API e Web estão ouvindo, abra
`http://127.0.0.1:5173` no navegador. Para chamadas diretas, a API fica em
`http://127.0.0.1:3000`. Mantenha o processo de desenvolvimento em execução
durante o teste para que watch/HMR continuem ativos.
