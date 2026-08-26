declare const brandMarker: unique symbol;

export type Brand<Value, Name extends string> = Value & {
  readonly [brandMarker]: Name;
};

export const brand = <Value, Name extends string>(
  value: Value,
): Brand<Value, Name> => value as Brand<Value, Name>;

export const unbrand = <Value, Name extends string>(
  value: Brand<Value, Name>,
): Value => value;

export type AthleteId = Brand<string, "AthleteId">;
export type SessionId = Brand<string, "SessionId">;
export type ExerciseId = Brand<string, "ExerciseId">;

export const asAthleteId = (raw: string): AthleteId =>
  brand<string, "AthleteId">(raw);

export const asSessionId = (raw: string): SessionId =>
  brand<string, "SessionId">(raw);

export const asExerciseId = (raw: string): ExerciseId =>
  brand<string, "ExerciseId">(raw);
