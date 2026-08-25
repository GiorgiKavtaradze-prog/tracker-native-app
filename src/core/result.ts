/**
 * Functional Result (ok/err) monad — the idiomatic way this clean-architecture
 * layer propagates typed errors without throwing exceptions across boundaries.
 *
 * Instead of `throw`ing raw Error objects deep inside use-cases, every application
 * use-case returns a `Result<T, E>`. Callers must explicitly handle both branches,
 * which keeps the control flow obvious and removes "hidden" exception channels.
 *
 * The type parameter defaults mention `never` so that `ok(value)` can infer a
 * loose error type while `err(error)` can target a specific error union.
 */

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/** Wraps a value as an `ok` result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Wraps an error as an `err` result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Type guard for the success branch. */
export function isOk<T, E>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } {
  return result.ok;
}

/** Type guard for the failure branch. */
export function isErr<T, E>(
  result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } {
  return !result.ok;
}

/** Maps the success value of a result, leaving the error branch untouched. */
export function map<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

/** Maps the error of a result, leaving the success branch untouched (for lifting). */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : result;
}

/** Chains a function that returns another result (`andThen` / flatMap). */
export function andThen<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

/** Returns the success value or throws the wrapped error — escape hatch for non-critical code. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) return result.value;
  throw result.error;
}

/** Branch handler mirroring a match expression; always returns a plain value. */
export function match<T, E, U>(
  result: Result<T, E>,
  onOk: (value: T) => U,
  onErr: (error: E) => U,
): U {
  return isOk(result) ? onOk(result.value) : onErr(result.error);
}

/** Collects all success values from an array of results, stopping at the first error. */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isOk(result)) {
      values.push(result.value);
    } else {
      return result;
    }
  }
  return ok(values);
}

/**
 * Bridges the "async/throw" world with the Result world.
 * Captures any synchronous throwable inside `task` and returns it as an `err`.
 */
export function trySync<T, N extends Error = Error>(
  task: () => T,
): Result<T, N> {
  try {
    return ok(task());
  } catch (error) {
    return err(error as N);
  }
}

/** Same as `trySync` but accepts both sync and async producers (awaits the result). */
export async function tryAsync<T, N extends Error = Error>(
  task: () => T | Promise<T>,
): Promise<Result<T, N>> {
  try {
    return ok(await task());
  } catch (error) {
    return err(error as N);
  }
}
