import type { AthleteId } from "../shared/brand";
import { roundToDecimals } from "../shared/numbers";
import { err, ok, type Result } from "../shared/result";
import { AggregateRoot } from "./common";
import {
  InvariantViolationError,
  ValidationError,
  type DomainError,
} from "./errors";

export const EXPERIENCE_LEVELS = [
  "novice",
  "intermediate",
  "advanced",
  "elite",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const isExperienceLevel = (
  candidate: unknown,
): candidate is ExperienceLevel =>
  typeof candidate === "string" &&
  (EXPERIENCE_LEVELS as readonly string[]).includes(candidate);

export interface BodyweightEntry {
  readonly kilograms: number;
  readonly measuredAtIso: string;
}

export interface AthleteSnapshot {
  readonly id: AthleteId;
  readonly displayName: string;
  readonly experience: ExperienceLevel;
  readonly bodyweightLog: readonly BodyweightEntry[];
}

const DISPLAY_NAME_MIN_LENGTH = 2;
const BODYWEIGHT_KG_CEILING = 400;

export class Athlete extends AggregateRoot<AthleteId> {
  private constructor(
    id: AthleteId,
    private readonly alias: string,
    private rank: ExperienceLevel,
    private readonly log: BodyweightEntry[],
  ) {
    super(id);
  }

  static register(
    id: AthleteId,
    displayName: string,
    experience: ExperienceLevel,
    bodyweightKg: number,
    registeredAt: Date,
  ): Result<Athlete, DomainError> {
    if (displayName.trim().length < DISPLAY_NAME_MIN_LENGTH) {
      return err(
        new ValidationError(
          `display name requires at least ${DISPLAY_NAME_MIN_LENGTH} characters`,
        ),
      );
    }
    if (
      !Number.isFinite(bodyweightKg) ||
      bodyweightKg <= 0 ||
      bodyweightKg > BODYWEIGHT_KG_CEILING
    ) {
      return err(
        new ValidationError(
          `bodyweight must fall within 0-${BODYWEIGHT_KG_CEILING} kg`,
          { bodyweightKg },
        ),
      );
    }
    const athlete = new Athlete(id, displayName.trim(), experience, [
      {
        kilograms: roundToDecimals(bodyweightKg, 1),
        measuredAtIso: registeredAt.toISOString(),
      },
    ]);
    athlete.raise({
      kind: "AthleteRegistered",
      athleteId: athlete.id,
      displayName: athlete.alias,
      occurredAt: registeredAt,
    });
    return ok(athlete);
  }

  static revive(snapshot: AthleteSnapshot): Athlete {
    return new Athlete(snapshot.id, snapshot.displayName, snapshot.experience, [
      ...snapshot.bodyweightLog,
    ]);
  }

  get displayName(): string {
    return this.alias;
  }

  get experience(): ExperienceLevel {
    return this.rank;
  }

  get currentBodyweightKg(): number | null {
    return this.log.at(-1)?.kilograms ?? null;
  }

  get bodyweightHistory(): readonly BodyweightEntry[] {
    return [...this.log];
  }

  promote(): Result<ExperienceLevel, DomainError> {
    const currentIndex = EXPERIENCE_LEVELS.indexOf(this.rank);
    if (currentIndex === EXPERIENCE_LEVELS.length - 1) {
      return err(
        new InvariantViolationError(
          "the athlete already holds the highest experience tier",
          {
            tier: this.rank,
          },
        ),
      );
    }
    const nextTier = EXPERIENCE_LEVELS[currentIndex + 1];
    this.rank = nextTier;
    return ok(nextTier);
  }

  logBodyweight(
    kilograms: number,
    measuredAt: Date,
  ): Result<BodyweightEntry, DomainError> {
    if (
      !Number.isFinite(kilograms) ||
      kilograms <= 0 ||
      kilograms > BODYWEIGHT_KG_CEILING
    ) {
      return err(
        new ValidationError(
          `bodyweight must fall within 0-${BODYWEIGHT_KG_CEILING} kg`,
          { kilograms },
        ),
      );
    }
    if (Number.isNaN(measuredAt.getTime())) {
      return err(new ValidationError("measuredAt is not a valid timestamp"));
    }
    const latest = this.log.at(-1);
    if (
      latest &&
      new Date(latest.measuredAtIso).getTime() >= measuredAt.getTime()
    ) {
      return err(
        new InvariantViolationError(
          "each measurement must be taken after the previously logged one",
        ),
      );
    }
    const entry: BodyweightEntry = {
      kilograms: roundToDecimals(kilograms, 1),
      measuredAtIso: measuredAt.toISOString(),
    };
    this.log.push(entry);
    this.raise({
      kind: "BodyweightRecorded",
      athleteId: this.id,
      weightKg: entry.kilograms,
      recordedAt: measuredAt,
    });
    return ok(entry);
  }

  snapshot(): AthleteSnapshot {
    return {
      id: this.id,
      displayName: this.alias,
      experience: this.rank,
      bodyweightLog: [...this.log],
    };
  }
}
