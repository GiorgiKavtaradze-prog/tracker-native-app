/**
 * Coaching use case — turns raw data into actionable training advice by composing
 * domain metrics with the existing periodization engine and the AI-coach port.
 *
 * Kept deliberately deterministic where possible (program generation, deload
 * detection) with the stochastic AI path isolated behind the `AICoachProvider`
 * port so it is swappable and testable.
 */
import { InfrastructureError } from "@/core/domain-error";
import { sumVolumeInWindow, tryAsync, type Result } from "@/core";
import { calculateACWR } from "@/lib/fitness-analytics";
import {
  generateLinearPeriodization,
  calculateWaveLoadingCycle,
  type PeriodizationProgram,
} from "@/lib/periodization-planner";
import type { AppPorts } from "@/application/ports";

export interface DailyCoachingAdvice {
  recommendedFocus: "push" | "pull" | "legs" | "full-body" | "rest";
  acwrRatio: number;
  riskZone: string;
  suggestedVolumeScale: number; // 1.0 = normal, <1 = reduce, >1 = taper up
  deloadSuggestion: boolean;
  reason: string;
}

export interface ProgramRecommendation {
  program: PeriodizationProgram;
  waveCycle: ReturnType<typeof calculateWaveLoadingCycle>;
}

export class CoachingService {
  constructor(private readonly deps: AppPorts) {}

  /** Generates an evidence-based daily training focus from recent load (ACWR). */
  async today(userId: string): Promise<Result<DailyCoachingAdvice>> {
    return tryAsync(async () => {
      const sessions = await this.deps.progress.listCompletedSessions(userId);
      const acwr = calculateACWR(
        sessions.map((session) => ({
          date: session.completedAt,
          volumeKg: session.totalVolumeKg,
        })),
      );

      const sevenDays = this.rollbackDays(7);
      const loadLastWeek = sumVolumeInWindow(sessions, sevenDays, new Date());

      let volumeScale = 1;
      if (acwr.acwrRatio > 1.3) volumeScale = 0.7;
      else if (acwr.acwrRatio > 1.1) volumeScale = 0.9;
      else if (acwr.acwrRatio < 0.8 && loadLastWeek === 0) volumeScale = 1.1;

      const restMode = acwr.acwrRatio > 1.5;

      return {
        recommendedFocus: restMode ? "rest" : "full-body",
        acwrRatio: acwr.acwrRatio,
        riskZone: acwr.riskZone,
        suggestedVolumeScale: volumeScale,
        deloadSuggestion: restMode,
        reason: acwr.recommendation,
      };
    });
  }

  /** Produces a periodized macrocycle plus a 5/3/1 wave for a main lift. */
  async plan(
    options: { weeks?: 4 | 8 | 12; oneRepMaxKg: number } = {
      weeks: 4,
      oneRepMaxKg: 100,
    },
  ): Promise<Result<ProgramRecommendation>> {
    return tryAsync(async () => {
      const program = generateLinearPeriodization(options.weeks ?? 4);
      const waveCycle = calculateWaveLoadingCycle(options.oneRepMaxKg);
      return { program, waveCycle };
    });
  }

  /** Asks the AI provider for a coaching / substitution recommendation. */
  async ask(question: {
    system: string;
    user: string;
  }): Promise<Result<string>> {
    try {
      const reply = await this.deps.ai.ask(question);
      return { ok: true, value: reply.content };
    } catch (cause) {
      return {
        ok: false,
        error: new InfrastructureError("AI coach unavailable", cause),
      };
    }
  }

  private rollbackDays(days: number): Date {
    const date = new Date(this.deps.clock.now());
    date.setDate(date.getDate() - days);
    return date;
  }
}
