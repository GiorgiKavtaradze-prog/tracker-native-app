import type { DomainError } from "../domain/errors";
import type { SetSpecAttributes } from "../domain/set-spec";
import type { ApplicationFailure, SessionSetDto } from "./dto";

export const toRuleRejection = (error: DomainError): ApplicationFailure => ({
  code: "RULE_REJECTED",
  reason: error.describe,
});

export const toSetAttributes = (dto: SessionSetDto): SetSpecAttributes => ({
  reps: dto.reps,
  weightKg: dto.weightKg,
  rpe: dto.rpe,
});
