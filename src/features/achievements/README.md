# Achievements & Milestones

Self-contained clean-architecture vertical. **Unused by design** — not referenced from
any screen, route or composition root, so it can be adopted or deleted freely.

## Layout

```
src/features/achievements/
├── domain/            models · metric registry · unlock rules
├── application/       ports · zod dto · AchievementsService
├── infrastructure/    InMemoryAchievementStore · createAchievementsModule
└── index.ts
```

## Dynamic extension points

| What              | How                                                           |
| ----------------- | ------------------------------------------------------------- |
| Add a milestone   | append a `MilestoneDefinition` (or pass `milestones`)         |
| Add a metric      | register a `MetricCalculator` under a new `metricKey`         |
| Override a metric | pass `calculators` — merged over `DEFAULT_METRIC_CALCULATORS` |
| Filter at runtime | `{ categories: [...] }` or `{ codes: [...] }`                 |
| Swap persistence  | implement `AchievementStore`, pass it as `store`              |

## Usage

```ts
import { createAchievementsModule } from "@/features/achievements";

const achievements = createAchievementsModule({
  progress: ports.progress,
});

const report = await achievements.service.evaluate(userId);
const consistencyOnly = await achievements.service.progress(userId, {
  categories: ["consistency"],
});
```

Custom milestones and metrics:

```ts
import {
  DEFAULT_MILESTONES,
  defineMilestones,
} from "@/features/achievements/domain";

createAchievementsModule({
  progress: ports.progress,
  milestones: defineMilestones(DEFAULT_MILESTONES, [
    {
      code: "hydration-days-30",
      title: "Hydrated",
      description: "Log hydration on 30 days.",
      category: "consistency",
      icon: "💧",
      metricKey: "hydration-days",
      target: 30,
    },
  ]),
  calculators: {
    "hydration-days": ({ sessions }) =>
      new Set(sessions.map((s) => s.completedAt.toDateString())).size,
  },
});
```

## Guarantees

- Typed `Result` boundaries via `@/core` — no raw throws.
- Injectable clock → deterministic tests.
- `evaluate` is idempotent; re-running with unchanged history persists nothing new.
