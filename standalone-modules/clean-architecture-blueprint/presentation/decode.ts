import { err, ok, type Result } from "../shared/result";

export type DecodedRecord = Record<string, unknown>;

export const asRecord = (candidate: unknown): Result<DecodedRecord, string> =>
  typeof candidate === "object" &&
  candidate !== null &&
  !Array.isArray(candidate)
    ? ok(candidate as DecodedRecord)
    : err("expected a JSON object");

export const requiredString = (
  source: DecodedRecord,
  key: string,
): Result<string, string> => {
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0
    ? ok(value.trim())
    : err(`${key} must be a non-empty string`);
};

export const optionalString = (
  source: DecodedRecord,
  key: string,
): Result<string | undefined, string> => {
  const value = source[key];
  if (value === undefined) return ok(undefined);
  return typeof value === "string"
    ? ok(value.trim())
    : err(`${key} must be a string`);
};

export const requiredNumber = (
  source: DecodedRecord,
  key: string,
): Result<number, string> => {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value)
    ? ok(value)
    : err(`${key} must be a finite number`);
};

export const recordArray = (
  source: DecodedRecord,
  key: string,
): Result<readonly DecodedRecord[], string> => {
  const value = source[key];
  if (!Array.isArray(value)) return err(`${key} must be an array`);
  return value.every(
    (entry) =>
      typeof entry === "object" && entry !== null && !Array.isArray(entry),
  )
    ? ok(value as readonly DecodedRecord[])
    : err(`${key} must contain only JSON objects`);
};
