# Contrato de entrada e estado do batch

Normalize the request into:

```text
scope: ordered task ids, a milestone, or “next unfinished tasks”
limit: exact number of tasks, or null
stop_at: task id, milestone end, or null
resume_from: task id or null
stop_on_failure: true
```

Interpret boundaries as follows:

- `N tarefas`: process at most `N` unfinished tasks from the selected starting point.
- `até o marco M`: process unfinished tasks through the last task belonging to `M`.
- `até a tarefa T`: include `T`, then stop after its successful completion.
- `retomar`: begin at the failed or blocked task only when explicitly requested; never silently repeat successful tasks.
- Multiple limits: use the earliest boundary reached.

If the request has no count or end boundary, use one task only and report that the batch is bounded to the next task.

Keep parent-side state like:

```text
batch_status: RUNNING | SUCCEEDED | FAILED | BLOCKED
tasks: [{ id, title, status, child_id, evidence }]
current_index: number
stop_reason: string | null
```

Do not persist this state in the repository unless the user requests a durable batch manifest.
