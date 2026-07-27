Esta é a raiz do projeto AutoHome V2.

<Progressive_Disclosure>
<Documentation>
Quando a solicitação criar, remover ou alterar documentação ou decisões de arquitetura, leia e siga integralmente [`documentation-workflow.md`](.codex/context/spec/documentation-workflow.md).
</Documentation>
<ImplementationFlow>
Quando o usuário pedir para implementar, retomar, ou executar uma ou duas tarefas em sequência, leia e siga integralmente [`implementation-flow.md`](.codex/context/spec/implementation-flow.md).
</ImplementationFlow>
<ProgressiveDisclosureHowto>
Quando for solicitado para atualizar, criar, editar ou entender o sistema de contexto progressivo, leia [`progressive-disclosure.md`](.codex/context/habilities/progressive-disclosure.md).
</ProgressiveDisclosureHowto>
</Progressive_Disclosure>

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->