import type { CompletedSession } from "../src/core/entities";
import {
  buildDailyLoads,
  computeEwmaRatio,
  computeFreshness,
  computeStrain,
  synthesiseRecommendation,
} from "../src/features/readiness/domain/engine";
import {
  DEFAULT_DELOAD_TRIGGERS,
  orderSignals,
} from "../src/features/readiness/domain/rules";
import type {
  DailyLoadPoint,
  TriggerContext,
} from "../src/features/readiness/domain/models";

const NOW = new Date("2026-08-25T10:00:00Z");

function session(dayOfMonth: number, volumeKg: number): CompletedSession {
  return {
    id: `s-${dayOfMonth}-${volumeKg}`,
    workoutId: "w1",
    workoutName: "Full Body",
    image: null,
    startedAt: new Date(Date.UTC(2026, 7, dayOfMonth, 9)),
    completedAt: new Date(Date.UTC(2026, 7, dayOfMonth, 10)),
    durationSeconds: 3_600,
    exerciseCount: 5,
    setCount: 20,
    totalVolumeKg: volumeKg,
    sets: [],
  };
}

function evaluate(
  label: string,
  sessions: CompletedSession[],
  dailyLoads: DailyLoadPoint[],
): void {
  const week = computeStrain(dailyLoads);
  const ewma = computeEwmaRatio(dailyLoads);
  const freshness = computeFreshness(dailyLoads);

  const priorWeeklySessions = [3, 3];
  const context: TriggerContext = {
    week,
    ewma,
    freshness,
    sessionsThisWeek: sessions.length > 0 ? 6 : 0,
    priorWeeklySessions,
  };
  const signals = orderSignals(
    DEFAULT_DELOAD_TRIGGERS.map((trigger) => trigger.evaluate(context)).filter(
      (signal): signal is NonNullable<typeof signal> => signal !== null,
    ),
  );

  console.log(`\n=== ${label} ===`);
  console.log("week:", week);
  console.log("ewma:", ewma);
  console.log("freshness:", freshness);
  console.log(
    "signals:",
    signals.map((signal) => `${signal.severity}:${signal.code}`),
  );
  console.log("recommendation:", synthesiseRecommendation(signals));

  const score = freshness.score;
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error(`freshness score out of range: ${score}`);
  }
}

const overtrained = [19, 20, 21, 22, 23, 24, 25].map((d) => session(d, 8_000));
evaluate(
  "Overreached athlete",
  overtrained,
  buildDailyLoads(overtrained, 28, NOW),
);

const detrained = [1, 2, 3].map((d) => session(d, 8_000));
evaluate("Detrained athlete", detrained, buildDailyLoads(detrained, 28, NOW));

evaluate("Brand-new user", [], buildDailyLoads([], 28, NOW));

console.log("\n✅ readiness smoke test passed");
