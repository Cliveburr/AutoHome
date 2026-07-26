
# Makeframe Batch Orchestrator

## Core protocol

1. Parse the request and load [the batch contract](references/batch-contract.md) when it has a count, milestone, final task, or resume boundary.
2. Read the repository `AGENTS.md` and `.agents/commands/plan-and-exec.md` before launching work. Treat that procedure as the implementation contract for every child.
3. Resolve the ordered task list. When the request says “next tasks” or names a milestone, inspect the implementation sequence and select only unfinished tasks in milestone order. Load [task selection rules](references/task-selection.md) when the boundary is ambiguous.
4. Create parent-side batch state with the ordered tasks, stop condition, current index, and `stop_on_failure=true`.
5. Launch exactly one subagent for the current task. Its prompt must include the task identifier, acceptance result, instruction to follow `plan-and-exec.md` end to end, and the exact final-result template from [the result and failure policy](references/result-and-failure-policy.md). Require every heading in that template, including `RESUME`, even when its value is `none`.
6. Wait for that child to reach a final result before launching another child. Never run two implementation children concurrently in the same Makeframe workspace.
7. Classify the child result using [the result and failure policy](references/result-and-failure-policy.md). Advance only on `SUCCESS` with validation evidence.
8. On `FAILED`, `BLOCKED`, `INTERRUPTED`, timeout without a trustworthy final result, missing validation evidence, or an infrastructure/tool error, stop immediately. Do not launch or queue later tasks. Close or interrupt the child when supported, then report the failure boundary and preserved workspace state.
9. On success, record the task and evaluate the stop condition. Stop cleanly when the requested count, task, or milestone is reached; otherwise launch the next task.
10. Finish with status, completed tasks, current/failed task, stop reason, validation evidence, and a resume instruction when applicable.

## Non-negotiable behavior

- Sequential means one implementation subagent active at a time.
- A child saying it “mostly worked” is not success.
- Do not repair a failed child in the parent and continue the same batch; stop and report unless the user explicitly asks to resume or repair.
- Preserve partial changes for diagnosis. Do not reset, discard, or overwrite them automatically.
- Do not mark a task done merely because a child edited files; `plan-and-exec.md` validation and its completion convention still apply.
- Do not create a new batch for a vague request. Ask for the missing boundary only when it cannot be derived safely.

## Progressive disclosure

<Progressive_Disclosure>
<BatchContract>
Quando a solicitação tiver quantidade, marco, tarefa final, retomada ou outro limite explícito, leia
[`batch-contract.md`](references/batch-contract.md).
</BatchContract>
<TaskSelection>
Quando for necessário descobrir a ordem, o primeiro item inacabado ou o limite de um marco, leia
[`task-selection.md`](references/task-selection.md).
</TaskSelection>
<ResultAndFailurePolicy>
Quando um subagent terminar, falhar, ficar bloqueado, for interrompido ou não apresentar evidências suficientes, leia
[`result-and-failure-policy.md`](references/result-and-failure-policy.md).
</ResultAndFailurePolicy>
</Progressive_Disclosure>
