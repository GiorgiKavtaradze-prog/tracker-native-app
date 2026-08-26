export const SCORING_PROFILE_NAMES = [
  "conservative",
  "standard",
  "aggressive",
] as const;
export type ScoringProfileName = (typeof SCORING_PROFILE_NAMES)[number];

export interface ScoringProfile {
  readonly name: ScoringProfileName;
  readonly monotonyWarning: number;
  readonly monotonyCritical: number;
  readonly ewmaElevated: number;
  readonly ewmaDanger: number;
  readonly freshnessFloor: number;
  readonly frequencySpikeRatio: number;
  readonly detrainingSilenceLoad: number;
}

const CONSERVATIVE: ScoringProfile = {
  name: "conservative",
  monotonyWarning: 1.8,
  monotonyCritical: 2.2,
  ewmaElevated: 1.25,
  ewmaDanger: 1.4,
  freshnessFloor: 50,
  frequencySpikeRatio: 1.5,
  detrainingSilenceLoad: 0.75,
};

const STANDARD: ScoringProfile = {
  name: "standard",
  monotonyWarning: 2,
  monotonyCritical: 2.5,
  ewmaElevated: 1.3,
  ewmaDanger: 1.5,
  freshnessFloor: 40,
  frequencySpikeRatio: 1.75,
  detrainingSilenceLoad: 0.5,
};

const AGGRESSIVE: ScoringProfile = {
  name: "aggressive",
  monotonyWarning: 2.2,
  monotonyCritical: 2.8,
  ewmaElevated: 1.35,
  ewmaDanger: 1.6,
  freshnessFloor: 30,
  frequencySpikeRatio: 2,
  detrainingSilenceLoad: 0.25,
};

export const SCORING_PROFILES: Record<
  ScoringProfileName,
  ScoringProfile
> = {
  conservative: CONSERVATIVE,
  standard: STANDARD,
  aggressive: AGGRESSIVE,
};

export function resolveProfile(
  input?: ScoringProfileName | ScoringProfile,
): ScoringProfile {
  if (!input) return STANDARD;
  if (typeof input === "string") return SCORING_PROFILES[input];
  return input;
}
