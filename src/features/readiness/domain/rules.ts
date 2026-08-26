import type {
  EwmaLoadRatio,
  StrainReport,
  TriggerContext,
  TriggerSignal,
} from "./models";
import { SCORING_PROFILES, type ScoringProfile } from "./profiles";

const SEVERITY_RANK = { info: 0, warning: 1, critical: 2 } as const;

export interface DeloadTrigger {
  readonly code: string;
  readonly evaluate: (context: TriggerContext) => TriggerSignal | null;
}

export function orderSignals(
  signals: readonly TriggerSignal[],
): TriggerSignal[] {
  return [...signals].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
  );
}

export function createMonotonyTrigger(profile: ScoringProfile): DeloadTrigger {
  return {
    code: "monotony-high",
    evaluate: ({ week }: { week: StrainReport }) => {
      if (week.weeklyLoad <= 0) return null;
      if (week.monotony >= profile.monotonyCritical) {
        return {
          code: "monotony-high",
          severity: "critical",
          title: "Monotonous training week",
          message: `Every day this week carried nearly identical load (monotony ≥ ${profile.monotonyCritical}). Schedule at least two genuinely easy days this week.`,
        };
      }
      if (week.monotony >= profile.monotonyWarning) {
        return {
          code: "monotony-high",
          severity: "warning",
          title: "Monotony creeping up",
          message: `Daily load has become too uniform (monotony ≥ ${profile.monotonyWarning}). Introduce hard/easy contrast before adding volume.`,
        };
      }
      return null;
    },
  };
}

export function createEwmaSpikeTrigger(profile: ScoringProfile): DeloadTrigger {
  return {
    code: "workload-spike",
    evaluate: ({ ewma }: { ewma: EwmaLoadRatio }) => {
      if (ewma.chronic <= 0) return null;
      if (ewma.ratio > profile.ewmaDanger) {
        return {
          code: "workload-spike",
          severity: "critical",
          title: "Acute workload spike",
          message: `Your recent workload is spiking far above your chronic baseline (EWMA ratio > ${profile.ewmaDanger}). Take a deload week or cut volume ~40%.`,
        };
      }
      if (ewma.ratio > profile.ewmaElevated) {
        return {
          code: "workload-spike",
          severity: "warning",
          title: "Workload climbing fast",
          message: `Training load is rising quickly relative to your base (EWMA ratio > ${profile.ewmaElevated}). Cap progression at ~10% this week.`,
        };
      }
      return null;
    },
  };
}

export function createDetrainingTrigger(
  profile: ScoringProfile,
): DeloadTrigger {
  return {
    code: "detraining-risk",
    evaluate: ({ ewma, freshness }) => {
      if (ewma.chronic <= 0) return null;
      const isSilent = freshness.fatigueLoad < profile.detrainingSilenceLoad;
      if (ewma.zone !== "undertraining" || !isSilent) return null;
      return {
        code: "detraining-risk",
        severity: "info",
        title: "Base is decaying",
        message:
          "Recent training volume has dropped well below your established baseline. Ease back in gradually rather than jumping straight to old loads.",
      };
    },
  };
}

export function createWeeklySpikeTrigger(
  profile: ScoringProfile,
): DeloadTrigger {
  return {
    code: "weekly-volume-spike",
    evaluate: ({ week, priorWeeklySessions, sessionsThisWeek }) => {
      const priorAvg =
        priorWeeklySessions.reduce((sum, count) => sum + count, 0) /
        Math.max(priorWeeklySessions.length, 1);
      if (priorAvg < 1 || sessionsThisWeek === 0) return null;
      const frequencyRatio = sessionsThisWeek / priorAvg;
      if (
        frequencyRatio >= profile.frequencySpikeRatio &&
        week.monotony >= 1.5 &&
        priorWeeklySessions.length >= 2
      ) {
        return {
          code: "weekly-volume-spike",
          severity: "warning",
          title: "Unusual training frequency",
          message: `You trained ${sessionsThisWeek}× this week versus a ${priorAvg.toFixed(1)}×/week average. Keep the extra sessions short and technical.`,
        };
      }
      return null;
    },
  };
}

export function createFatigueDominanceTrigger(
  profile: ScoringProfile,
): DeloadTrigger {
  return {
    code: "fatigue-dominance",
    evaluate: ({ freshness }) => {
      if (
        freshness.score >= profile.freshnessFloor ||
        freshness.fitnessLoad <= 0
      )
        return null;
      return {
        code: "fatigue-dominance",
        severity: freshness.score < 20 ? "critical" : "warning",
        title: "Fatigue is winning",
        message:
          "Readiness score is low — accumulated fatigue now exceeds your fitness base. Prioritise sleep and consider 4–7 easy days.",
      };
    },
  };
}

export function createDefaultTriggers(
  profile: ScoringProfile,
): readonly DeloadTrigger[] {
  return [
    createEwmaSpikeTrigger(profile),
    createFatigueDominanceTrigger(profile),
    createMonotonyTrigger(profile),
    createWeeklySpikeTrigger(profile),
    createDetrainingTrigger(profile),
  ];
}

export const DEFAULT_DELOAD_TRIGGERS: readonly DeloadTrigger[] =
  createDefaultTriggers(SCORING_PROFILES.standard);

export function defineTriggers(
  custom: readonly DeloadTrigger[],
  base: readonly DeloadTrigger[] = DEFAULT_DELOAD_TRIGGERS,
): readonly DeloadTrigger[] {
  return [...custom, ...base];
}
