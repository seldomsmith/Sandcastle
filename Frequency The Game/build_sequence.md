# Antigravity Implementation Plan: Foundational Build Sequence

## Instructions for Agent Manager

Your primary directive is to execute the foundational build sequence for the Public Transit Service Allocation Simulation. Read the `vision.md` file thoroughly to establish the global architectural context before beginning any code generation. You must adhere to the following workflow orchestration rules, task management protocols, and core engineering principles.

### Workflow Orchestration
*   **Plan Mode Default:** Enter plan mode for any task requiring three or more steps. Write detailed specifications upfront to reduce ambiguity. If an execution path fails, stop and re-plan immediately.
*   **Subagent Strategy:** Use subagents liberally to keep the main context window clean. Assign exactly one specific task per subagent to ensure focused execution. Throw additional compute resources at complex problems, particularly the WebGL rendering and the gravity model mathematics.
*   **Self-Improvement Loop:** After making any correction, you must update the `tasks/lessons.md` file (generate if not started already). Write explicit rules to prevent the repetition of the same mistake and iterate ruthlessly until the error rate drops to zero.
*   **Strict Verification:** Never mark a task complete without proving it works. Run tests, check terminal logs, and demonstrate correctness visually using the integrated browser. Evaluate all generated code by asking if a senior staff engineer would approve the logic.
*   **Elegant Execution:** Pause to consider if a more elegant mathematical or architectural solution exists. However, you must balance this by avoiding the over-engineering of simple fixes.
*   **Autonomous Resolution:** When given a bug report or terminal error, fix the root cause autonomously. Require zero context switching or manual code pasting from the user.

### Task Management Protocol
1.  **Plan First:** Write your execution plan to `tasks/todo.md`.
2.  **Verify Plan:** Check in with the user to verify the plan before starting the codebase manipulation.
3.  **Track Progress:** Mark items complete sequentially. Do not proceed to a new step until the current step compiles without errors and passes visual verification.
4.  **Explain Changes:** Provide a high-level summary of your architectural choices at each step.
5.  **Document Results:** Add a comprehensive review section to `tasks/todo.md` upon completing a step.
6.  **Capture Lessons:** Update `tasks/lessons.md` immediately after implementing any bug corrections.

### Core Engineering Principles
*   **Simplicity First:** Make every code change as simple and readable as possible.
*   **No Laziness:** Find and resolve root causes. Do not apply temporary patches or bypass strict TypeScript compiler warnings.
*   **Minimal Impact:** Only touch the files and functions absolutely necessary to achieve the current objective.
