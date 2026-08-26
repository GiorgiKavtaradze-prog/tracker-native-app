import { asAthleteId } from "../../shared/brand";
import { err, ok, type Result } from "../../shared/result";
import { Athlete } from "../../domain/athlete";
import type {
  ApplicationFailure,
  AthleteView,
  RegisterAthleteCommand,
} from "../dto";
import { toRuleRejection } from "../mappers";
import type {
  AthleteRepository,
  Clock,
  DomainEventBus,
  IdentifierFactory,
} from "../ports";

export interface RegisterAthleteDependencies {
  readonly athletes: AthleteRepository;
  readonly identifiers: IdentifierFactory;
  readonly clock: Clock;
  readonly bus: DomainEventBus;
}

export class RegisterAthlete {
  constructor(private readonly dependencies: RegisterAthleteDependencies) {}

  async execute(
    command: RegisterAthleteCommand,
  ): Promise<Result<AthleteView, ApplicationFailure>> {
    if (
      typeof command.displayName !== "string" ||
      command.displayName.trim().length === 0
    ) {
      return err({
        code: "MALFORMED_INPUT",
        reason: "displayName is required",
      });
    }
    if (!Number.isFinite(command.bodyweightKg)) {
      return err({
        code: "MALFORMED_INPUT",
        reason: "bodyweightKg must be a finite number",
      });
    }
    const registeredAt = this.dependencies.clock.now();
    const registration = Athlete.register(
      asAthleteId(this.dependencies.identifiers.issue()),
      command.displayName,
      command.experience,
      command.bodyweightKg,
      registeredAt,
    );
    if (registration.success === false) {
      return err(toRuleRejection(registration.error));
    }
    const athlete = registration.value;
    await this.dependencies.athletes.save(athlete);
    await this.dependencies.bus.dispatch(athlete.pullDomainEvents());
    return ok({
      athleteId: athlete.id,
      displayName: athlete.displayName,
      experience: athlete.experience,
      currentBodyweightKg: athlete.currentBodyweightKg,
    });
  }
}
