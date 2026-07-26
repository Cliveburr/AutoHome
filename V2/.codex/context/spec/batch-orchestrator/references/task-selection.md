# Seleção das tarefas

Read `docs/07-sequencia-de-implementacao.md` and preserve its numeric order. A task is unfinished when its adopted completion marker is absent; do not use Git status, a child summary, or a passing test as a substitute for that marker.

For a named milestone, read the corresponding `docs/0*-marco-*.md` document when the sequence does not make the boundary obvious. For an adaptation block such as `AD-*`, treat its block as an ordered workstream and do not skip an earlier unfinished item.

Before the first child, report the resolved task IDs and the stopping condition in the parent response. If the sequence contains a partially completed task, choose it only when its entry is not marked complete and its scope is clear.

Do not mark a task complete from the parent. The child must follow `plan-and-exec.md`, run relevant checks, review its diff, and apply the repository's completion convention as part of its own implementation.
