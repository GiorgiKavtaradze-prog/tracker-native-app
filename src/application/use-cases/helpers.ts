/**
 * Shared helpers for the use-case layer — small utilities that keep individual
 * use-cases focused on orchestration instead of boilerplate.
 */
import type { ZodError } from "zod";
import { ValidationError, type Result, err, ok } from "@/core";

/** Formats a ZodError into a single readable message string. */
export function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) =>
      issue.path.length > 0
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message,
    )
    .join("; ");
}

/** Convenience: wraps a raw unknown input into a typed `Result`. */
export function asResult<T>(value: T): Result<T, never> {
  return ok(value);
}

/** Normalises any thrown error into an `AppError`-typed Result for a value of T. */
export function asAppErrorResult<T>(
  error: unknown,
): Result<T, ValidationError | Error> {
  return {
    ok: false,
    error: error instanceof ValidationError ? error : new Error(String(error)),
  };
}
