# Resultado, falha e parada

Require every child to finish with:

```text
STATUS: SUCCESS | FAILED | BLOCKED
TASK: <identifier>
SUMMARY: <short result>
CHANGED: <files or none>
VALIDATION: <commands and outcomes>
BLOCKER: <none or concrete blocker>
RESUME: <task identifier or none>
```

Classify as `SUCCESS` only when implementation is complete, relevant validation commands passed, the diff was reviewed, and the task completion convention was applied. Treat an absent field, ambiguous status, failed command, unresolved test, uncommitted required change, or contradiction between summary and workspace as non-success.

Classify as `FAILED` for implementation or validation errors. Classify as `BLOCKED` when external state, missing authority, or an unresolved prerequisite prevents safe progress. Classify as `INTERRUPTED` in parent state when the child stops before producing a valid result; it is never successful.

On any non-success:

1. Stop launching tasks immediately.
2. Interrupt or close the child if the available subagent tool supports it.
3. Preserve the workspace exactly as found after the child stopped.
4. Capture the command/error and last known task identifier.
5. Report completed tasks separately from the failed or blocked task.
6. Offer `resume_from=<task>` only after the user decides whether to repair, retry, or inspect partial changes.

Never automatically retry a failed implementation. A retry can duplicate side effects, obscure the first failure, or conflict with partial edits.
