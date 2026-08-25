/**
 * Infrastructure adapters for cross-cutting concerns: time, identifiers and
 * logging. These implement the ports defined in the application layer so the
 * use-cases stay decoupled from the runtime they run on.
 */
import type { Clock, IdGenerator, Logger } from "@/application/ports";

/** Real wall-clock adapter. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * Collision-safe-enough unique id generator that runs everywhere (Node, Hermes,
 * browsers) without depending on WebCrypto. Uses a nanosecond-ish composite:
 * timestamp + random suffix + monotonic counter.
 */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  generate(prefix = "id"): string {
    this.counter = (this.counter + 1) % 10000;
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 10);
    const seq = this.counter.toString(36).padStart(3, "0");
    return `${prefix}_${ts}_${rand}_${seq}`;
  }
}

/** Lightweight JSON logger that can be swapped for a real observability sink. */
export class ConsoleLogger implements Logger {
  constructor(private readonly scope = "app") {}

  info(event: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(`[${this.scope}]`, event, context ?? "");
  }

  warn(event: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.warn(`[${this.scope}]`, event, context ?? "");
  }

  error(event: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.error(`[${this.scope}]`, event, context ?? "");
  }
}

/** Silent logger — useful for tests and headless environments. */
export class NullLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
}
