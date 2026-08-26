import type {
  Clock,
  DomainEventBus,
  EventSubscription,
  IdentifierFactory,
  TransactionCoordinator,
} from "../application/ports";
import type { DomainEvent, EventHandler, EventName } from "../domain/events";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FrozenClock implements Clock {
  constructor(private readonly frozenAt: Date) {}

  now(): Date {
    return new Date(this.frozenAt.getTime());
  }
}

export class SequentialIdentifierFactory implements IdentifierFactory {
  private counter = 0;

  constructor(private readonly namespace: string) {}

  issue(): string {
    this.counter += 1;
    return `${this.namespace}_${this.counter.toString(36).padStart(8, "0")}`;
  }
}

type DispatchFailureSink = (event: DomainEvent, cause: unknown) => void;

export class InProcessEventBus implements DomainEventBus {
  private readonly listeners = new Map<
    EventName,
    Set<EventHandler<EventName>>
  >();

  constructor(private readonly onFailure: DispatchFailureSink = () => {}) {}

  subscribe<K extends EventName>(
    name: K,
    handler: EventHandler<K>,
  ): EventSubscription {
    const bucket =
      this.listeners.get(name) ?? new Set<EventHandler<EventName>>();
    const widened = handler as EventHandler<EventName>;
    bucket.add(widened);
    this.listeners.set(name, bucket);
    return () => {
      bucket.delete(widened);
    };
  }

  async dispatch(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      const bucket = this.listeners.get(event.kind);
      if (!bucket) continue;
      for (const listener of bucket) {
        try {
          await listener(event);
        } catch (cause) {
          this.onFailure(event, cause);
        }
      }
    }
  }
}

export class PassthroughTransactions implements TransactionCoordinator {
  async run<T>(unit: () => Promise<T>): Promise<T> {
    return unit();
  }
}
