/**
 * Typed error hierarchy for the clean-architecture layer.
 *
 * Every error that crosses a use-case boundary derives from {@link AppError} and
 * carries a stable machine-readable `code` as well as a human message. Keeping a
 * single base type lets callers switch on `error.code` instead of relying on
 * fragile `instanceof` chains, and lets the transport layer (HTTP / UI toasts)
 * render errors consistently via the shared `toErrorPayload` helper.
 */

/** Base class for every domain-ish error in the application layer. */
export abstract class AppError extends Error {
  /** Stable machine-readable identifier (e.g. "NOT_FOUND"). */
  abstract readonly code: string;
  /** Optional additional context resolved before serialisation. */
  abstract readonly status: number;

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
  }
}

/** Input failed schema or invariant validation (maps to HTTP 400). */
export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR" as const;
  readonly status = 400;
}

/** The requested resource does not exist (maps to HTTP 404). */
export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND" as const;
  readonly status = 404;
}

/** The operation conflicts with the current state of the system (maps to HTTP 409). */
export class ConflictError extends AppError {
  readonly code = "CONFLICT" as const;
  readonly status = 409;
}

/** The caller did not provide valid credentials/permissions (maps to HTTP 401/403). */
export class UnauthorizedError extends AppError {
  readonly code = "UNAUTHORIZED" as const;
  readonly status = 401;
}

/** A downstream system (DB, AI provider, third-party service) failed. */
export class InfrastructureError extends AppError {
  readonly code = "INFRASTRUCTURE_ERROR" as const;
  readonly status = 500;
}

/** Requested operation is not supported by the current configuration. */
export class ConfigurationError extends AppError {
  readonly code = "CONFIGURATION_ERROR" as const;
  readonly status = 500;
}

/** Business rule violation that is not covered by a schema (still HTTP 422-ish). */
export class BusinessRuleViolation extends AppError {
  readonly code = "BUSINESS_RULE_VIOLATION" as const;
  readonly status = 422;
}

/** Wraps a generic, non-`AppError` throwable so it can flow through Result boundaries. */
export function toAppError(cause: unknown): AppError {
  if (cause instanceof AppError) return cause;
  if (cause instanceof Error) {
    return new InfrastructureError(cause.message, cause);
  }
  return new InfrastructureError(String(cause));
}

/** Minimal, serialisable shape shared by API routes and error toasts. */
export interface AppErrorPayload {
  message: string;
  code: string;
  status: number;
}

/** Translates any AppError (or generic error) into a uniform client payload. */
export function toAppErrorPayload(error: AppError): AppErrorPayload {
  return {
    message: error.message,
    code: error.code,
    status: error.status,
  };
}
