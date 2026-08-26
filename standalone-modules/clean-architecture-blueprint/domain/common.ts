import type { DomainEvent } from "./events";

export abstract class ValueObject {
  protected abstract components(): readonly unknown[];

  equals(candidate: unknown): boolean {
    if (!(candidate instanceof ValueObject)) return false;
    if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(candidate))
      return false;
    const mine = this.components();
    const theirs = candidate.components();
    return (
      mine.length === theirs.length &&
      mine.every((part, index) => part === theirs[index])
    );
  }
}

export abstract class Entity<TId> {
  protected constructor(readonly id: TId) {}

  equals(candidate: unknown): boolean {
    return (
      candidate instanceof Entity &&
      Object.getPrototypeOf(this) === Object.getPrototypeOf(candidate) &&
      this.id === (candidate as Entity<TId>).id
    );
  }
}

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private readonly pendingEvents: DomainEvent[] = [];

  protected raise(event: DomainEvent): void {
    this.pendingEvents.push(event);
  }

  pullDomainEvents(): readonly DomainEvent[] {
    const drained = [...this.pendingEvents];
    this.pendingEvents.length = 0;
    return drained;
  }
}
