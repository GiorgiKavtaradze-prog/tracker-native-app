/**
 * Application layer — use-cases and their ports. This layer depends only on
 * `@/core` (domain) and Zod; it never touches React, Drizzle, or the network.
 * Concrete wiring is supplied by `@/infrastructure/composition-root`.
 */
export * from "./dto";
export type * from "./ports";
export * from "./use-cases/workouts";
export * from "./use-cases/sessions";
export * from "./use-cases/analytics";
export * from "./use-cases/coaching";
export * from "./use-cases/personalization";