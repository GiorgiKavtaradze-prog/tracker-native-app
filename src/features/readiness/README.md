# Readiness & Fatigue Intelligence

Self-contained clean-architecture vertical — **new functionality, unused by any
existing screen** until you adopt it. It turns raw session history into the
sports-science signals that commercial platforms gate behind wearables:

| Signal                              | Science                        | Where              |
| ----------------------------------- | ------------------------------ | ------------------ |
| Daily-load series (rest days = 0)   | load bucketing                 | `domain/engine.ts` |
| Training Monotony & Strain          | Foster, 1998                   | `domain/engine.ts` |
| EWMA acute:chronic workload ratio   | Williams et al., 2017          | `domain/engine.ts` |
| Freshness / readiness score (0–100) | Banister fitness-fatigue model | `domain/engine.ts` |
| Deload triggers + coaching sentence | declarative rule registry      | `domain/rules.ts`  |

> Note: the simple rolling-average ACWR in `@/lib/fitness-analytics` is a
> different algorithm; the EWMA ratio here reacts to recent spikes days earlier.

## Scoring profiles, trend & risk

| Capability                                                      | What it adds                                                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SCORING_PROFILES` (`conservative` / `standard` / `aggressive`) | Per-athlete thresholds for monotony, EWMA bounds, freshness floor, frequency spike & detraining silence — passed per request via `?profile=` or as a service option |
| Trigger factories                                               | `createDefaultTriggers(profile)` builds rule sets from any profile; custom `DeloadTrigger`s still override everything                                               |
| `computeTrend`                                                  | Least-squares slope of daily load (units/day) + week-over-week delta % with `rising/steady/falling` classification                                                  |
| `assessRisk`                                                    | Composite 0–100 risk index from signal severities + fatigue penalty, mapped to `low/moderate/high/severe` with a concrete `actionPlan`                              |

```ts
const readiness = createReadinessModule({
  progress: ports.progress,
  profile: SCORING_PROFILES.conservative,
});

// or per-request:
readiness.service.evaluateFromRawInput(userId, { profile: "aggressive" });
```

## Layout

```
src/features/readiness/
├── domain/            models · pure math engine · deload rule registry
├── application/       ports · zod dto · ReadinessService (+ transport payload mapper)
├── infrastructure/    createReadinessModule composition
└── index.ts
```

## Already wired for you

- **API** — `GET /api/readiness` (`src/app/api/readiness/index+api.ts`) with the
  canonical pipeline: auth guard → zod → service → typed JSON.
  Params: `windowDays` (14–90, default 28), `acuteDays` (3–14, default 7),
  `chronicDays` (7–56, default 28).
- **Client hook** — `useReadiness()` in `src/hooks/use-readiness.ts`
  (TanStack Query, 5-min stale time), fetcher in `src/lib/api.ts`.

```tsx
import { useReadiness } from "@/hooks/use-readiness";

function ReadinessBadge() {
  const { data } = useReadiness();
  if (!data) return null;
  return <Text>{`${data.freshness.score} · ${data.freshness.zone}`}</Text>;
}
```

## Dynamic extension points

| What                  | How                                                         |
| --------------------- | ----------------------------------------------------------- |
| Add a deload rule     | implement `DeloadTrigger`, pass via `triggers` option       |
| Swap load definition  | pass `estimator` (e.g. future session-RPE: `minutes × RPE`) |
| Freeze time in tests  | inject a `clock`                                            |
| Custom analysis spans | query params (`windowDays/acuteDays/chronicDays`)           |

## Usage (server side)

```ts
import { createAppContainer } from "@/infrastructure";
import { createReadinessModule } from "@/features/readiness";

const container = createAppContainer();
const readiness = createReadinessModule({ progress: container.ports.progress });

const report = await readiness.service.evaluateFromRawInput(userId, {
  windowDays: "28",
});
// Result<ReadinessReport> — no throws across the boundary.
```

## Guarantees

- Pure domain: no React, Drizzle or AI imports below the infrastructure folder.
- Typed `Result` boundaries via `@/core`; errors carry HTTP-ready status codes.
- Deterministic: all time flows through the injected clock; UTC day bucketing.
- No schema changes — computed from existing `workout_sessions` history.
