import { roundToDecimals } from "../shared/numbers";
import { err, ok, type Result } from "../shared/result";
import { ValueObject } from "./common";
import { ValidationError, type DomainError } from "./errors";

export interface SetSpecAttributes {
  readonly reps: number;
  readonly weightKg: number;
  readonly rpe: number;
}

const REPS_BOUNDS = { min: 1, max: 50 } as const;
const WEIGHT_KG_LIMITS = { min: 0, max: 500 } as const;
const RPE_LIMITS = { min: 4, max: 10 } as const;

const alignsToHalfStep = (value: number): boolean =>
  Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;

export class SetSpec extends ValueObject {
  private constructor(private readonly attributes: SetSpecAttributes) {
    super();
  }

  static create(candidate: SetSpecAttributes): Result<SetSpec, DomainError> {
    if (
      !Number.isInteger(candidate.reps) ||
      candidate.reps < REPS_BOUNDS.min ||
      candidate.reps > REPS_BOUNDS.max
    ) {
      return err(
        new ValidationError(
          `reps must be an integer between ${REPS_BOUNDS.min} and ${REPS_BOUNDS.max}`,
          { reps: candidate.reps },
        ),
      );
    }
    if (
      !Number.isFinite(candidate.weightKg) ||
      candidate.weightKg < WEIGHT_KG_LIMITS.min ||
      candidate.weightKg > WEIGHT_KG_LIMITS.max
    ) {
      return err(
        new ValidationError(
          `weightKg must stay within ${WEIGHT_KG_LIMITS.min}-${WEIGHT_KG_LIMITS.max} kg`,
          { weightKg: candidate.weightKg },
        ),
      );
    }
    if (
      !Number.isFinite(candidate.rpe) ||
      candidate.rpe < RPE_LIMITS.min ||
      candidate.rpe > RPE_LIMITS.max ||
      !alignsToHalfStep(candidate.rpe)
    ) {
      return err(
        new ValidationError(
          `rpe must be a half-step value between ${RPE_LIMITS.min} and ${RPE_LIMITS.max}`,
          { rpe: candidate.rpe },
        ),
      );
    }
    return ok(
      new SetSpec({
        reps: candidate.reps,
        weightKg: roundToDecimals(candidate.weightKg, 2),
        rpe: candidate.rpe,
      }),
    );
  }

  static rehydrate(attributes: SetSpecAttributes): SetSpec {
    return new SetSpec(attributes);
  }

  get reps(): number {
    return this.attributes.reps;
  }

  get weightKg(): number {
    return this.attributes.weightKg;
  }

  get rpe(): number {
    return this.attributes.rpe;
  }

  get volumeKg(): number {
    return roundToDecimals(this.attributes.weightKg * this.attributes.reps, 2);
  }

  get repetitionsInReserve(): number {
    return roundToDecimals(Math.max(0, 10 - this.attributes.rpe), 1);
  }

  get estimatedOneRepMaxKg(): number {
    return roundToDecimals(this.attributes.weightKg * (1 + this.attributes.reps / 30), 1);
  }

  toAttributes(): SetSpecAttributes {
    return { ...this.attributes };
  }

  protected components(): readonly unknown[] {
    return [this.attributes.reps, this.attributes.weightKg, this.attributes.rpe];
  }
}