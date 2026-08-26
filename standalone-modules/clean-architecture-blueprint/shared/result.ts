export interface Ok<T> {
  readonly success: true;
  readonly value: T;
}

export interface Err<E> {
  readonly success: false;
  readonly error: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ success: true, value });

export const err = <E>(error: E): Err<E> => ({ success: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> =>
  result.success;

export const isErr = <T, E>(result: Result<T, E>): result is Err<E> =>
  !result.success;

export const mapOk = <T, U, E>(
  result: Result<T, E>,
  transform: (value: T) => U,
): Result<U, E> => (isOk(result) ? ok(transform(result.value)) : result);

export const mapErr = <T, E, F>(
  result: Result<T, E>,
  transform: (error: E) => F,
): Result<T, F> => (isErr(result) ? err(transform(result.error)) : result);

export const andThen = <T, U, E>(
  result: Result<T, E>,
  step: (value: T) => Result<U, E>,
): Result<U, E> => (isOk(result) ? step(result.value) : result);

export const unwrapOr = <T, E>(result: Result<T, E>, fallback: T): T =>
  isOk(result) ? result.value : fallback;

export const matchResult = <T, E, R>(
  result: Result<T, E>,
  onSuccess: (value: T) => R,
  onFailure: (error: E) => R,
): R => (isOk(result) ? onSuccess(result.value) : onFailure(result.error));

export const attempt = <T, E>(
  operation: () => T,
  recover: (cause: unknown) => E,
): Result<T, E> => {
  try {
    return ok(operation());
  } catch (cause) {
    return err(recover(cause));
  }
};
