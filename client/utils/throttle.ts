/**
 * Wraps a promise returning function so bursts of calls are collapsed.
 *
 * The first call executes `fn` immediately. Calls received while an execution
 * is in progress, or before `cooldownMs` has elapsed since that execution
 * started, share a single follow-up execution and all receive its result.
 * Executions never overlap.
 *
 * Not replaceable with `lodash.throttle`: that one measures its window in wall
 * clock time only, so it fires the trailing call even if the previous async
 * execution is still running (executions would overlap), and callers inside
 * the window get the result of the execution that started before their call
 * rather than one that reflects it.
 */
export function throttlePromise<T>(fn: () => Promise<T>, cooldownMs: number): () => Promise<T> {
    let pending: Promise<T> | null = null;

    // Resolves once the current execution has finished and its cooldown has elapsed
    let gate: Promise<void> | null = null;

    function execute(): Promise<T> {
        const result = fn();
        const cooldown = new Promise<void>((resolve) => {
            setTimeout(resolve, cooldownMs);
        });

        gate = Promise.all([result.catch(() => null), cooldown]).then(() => {
            gate = null;
        });

        return result;
    }

    return () => {
        if (pending != null) {
            return pending;
        }

        if (gate == null) {
            return execute();
        }

        pending = gate.then(() => {
            pending = null;

            return execute();
        });

        return pending;
    };
}
