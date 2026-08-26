import {
  ReadinessService,
  type ReadinessClock,
  type ReadinessLogger,
  type ReadinessOptions,
  type ReadinessPorts,
  type ReadinessProgressSource,
} from "../application";

class SystemClock implements ReadinessClock {
  now(): Date {
    return new Date();
  }
}

class NoopLogger implements ReadinessLogger {
  info(): void {}
}

export interface ReadinessModule {
  readonly service: ReadinessService;
}

export interface ReadinessModuleInput extends ReadinessOptions {
  progress: ReadinessProgressSource;
  clock?: ReadinessClock;
  logger?: ReadinessLogger;
}

export function createReadinessModule(
  input: ReadinessModuleInput,
): ReadinessModule {
  const ports: ReadinessPorts = {
    progress: input.progress,
    clock: input.clock ?? new SystemClock(),
    logger: input.logger ?? new NoopLogger(),
  };

  return {
    service: new ReadinessService(ports, {
      estimator: input.estimator,
      triggers: input.triggers,
    }),
  };
}
