import { MILLISECONDS_PER_DAY } from "./domain/analytics";
import { composeContainer } from "./infrastructure/composition-root";
import { buildHttpApi, type Envelope } from "./presentation/http-api";

interface ShowcaseSetPlan {
  readonly reps: number;
  readonly weightKg: number;
  readonly rpe: number;
}

interface ShowcaseExercisePlan {
  readonly exerciseId: string;
  readonly sets: readonly ShowcaseSetPlan[];
}

interface ShowcaseSessionPlan {
  readonly dayOffset: number;
  readonly title: string;
  readonly exercises: readonly ShowcaseExercisePlan[];
}

export interface ShowcaseStep {
  readonly label: string;
  readonly status: number;
  readonly envelope: Envelope<unknown>;
}

const SESSION_PLANS: readonly ShowcaseSessionPlan[] = [
  {
    dayOffset: 0,
    title: "Push Foundations",
    exercises: [
      {
        exerciseId: "ex-bench-press",
        sets: [
          { reps: 8, weightKg: 60, rpe: 7 },
          { reps: 8, weightKg: 62.5, rpe: 8 },
          { reps: 6, weightKg: 65, rpe: 9 },
        ],
      },
    ],
  },
  {
    dayOffset: 1,
    title: "Posterior Chain",
    exercises: [
      {
        exerciseId: "ex-deadlift",
        sets: [
          { reps: 5, weightKg: 140, rpe: 7 },
          { reps: 5, weightKg: 145, rpe: 8 },
          { reps: 3, weightKg: 150, rpe: 9 },
        ],
      },
      {
        exerciseId: "ex-pull-up",
        sets: [
          { reps: 10, weightKg: 0, rpe: 6 },
          { reps: 8, weightKg: 0, rpe: 7 },
        ],
      },
    ],
  },
  {
    dayOffset: 2,
    title: "Press Peak",
    exercises: [
      {
        exerciseId: "ex-bench-press",
        sets: [
          { reps: 5, weightKg: 72.5, rpe: 8 },
          { reps: 3, weightKg: 77.5, rpe: 9 },
        ],
      },
    ],
  },
];

const anchorIsoAt = (dayOffset: number): string =>
  new Date(Date.now() - (3 - dayOffset) * MILLISECONDS_PER_DAY).toISOString();

export const runShowcase = async (): Promise<readonly ShowcaseStep[]> => {
  const container = composeContainer();
  const api = buildHttpApi(container);
  const steps: ShowcaseStep[] = [];

  const registration = await api.serve({
    verb: "POST",
    path: "/athletes",
    query: {},
    body: {
      displayName: "Nika Beridze",
      experience: "intermediate",
      bodyweightKg: 82.4,
    },
  });
  steps.push({
    label: "register athlete",
    status: registration.status,
    envelope: registration.envelope,
  });

  let athleteIdRef = "";
  if (registration.envelope.outcome === "success") {
    athleteIdRef = String(
      (registration.envelope.data as { athleteId?: unknown }).athleteId ?? "",
    );
  }

  for (const plan of SESSION_PLANS) {
    const response = await api.serve({
      verb: "POST",
      path: "/training-sessions",
      query: {},
      body: {
        athleteId: athleteIdRef,
        title: plan.title,
        startedAtIso: anchorIsoAt(plan.dayOffset),
        completedAtIso: anchorIsoAt(plan.dayOffset + 1 / 24),
        exercises: plan.exercises,
      },
    });
    steps.push({
      label: `log session: ${plan.title}`,
      status: response.status,
      envelope: response.envelope,
    });
  }

  const impossibleSet = await api.serve({
    verb: "POST",
    path: "/training-sessions",
    query: {},
    body: {
      athleteId: athleteIdRef,
      startedAtIso: anchorIsoAt(3),
      completedAtIso: anchorIsoAt(3.05),
      exercises: [
        {
          exerciseId: "ex-bench-press",
          sets: [{ reps: 5, weightKg: 90, rpe: 11 }],
        },
      ],
    },
  });
  steps.push({
    label: "reject impossible set",
    status: impossibleSet.status,
    envelope: impossibleSet.envelope,
  });

  const ghostDashboard = await api.serve({
    verb: "GET",
    path: "/athletes/ghost/dashboard",
    query: {},
  });
  steps.push({
    label: "dashboard for unknown athlete",
    status: ghostDashboard.status,
    envelope: ghostDashboard.envelope,
  });

  const dashboard = await api.serve({
    verb: "GET",
    path: `/athletes/${athleteIdRef}/dashboard`,
    query: { horizonDays: "30" },
  });
  steps.push({
    label: "training dashboard",
    status: dashboard.status,
    envelope: dashboard.envelope,
  });

  return steps;
};
