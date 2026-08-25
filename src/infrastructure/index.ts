/**
 * Infrastructure layer — concrete adapters (Drizzle repositories, an id/clock
 * provider, an AI coach adapter) plus the composition root that wires everything.
 * This is the only layer allowed to import `@/db` and network/AI SDKs.
 */
export * from "./clock";
export * from "./composition-root";
export * from "./repositories/mappers";
export * from "./repositories/drizzle-workouts";
export * from "./repositories/drizzle-sessions";
export * from "./repositories/drizzle-catalog";
export * from "./ai/ai-coach-adapter";
