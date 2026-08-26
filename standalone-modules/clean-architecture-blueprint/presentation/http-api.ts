import type {
  ApplicationFailure,
  LogTrainingSessionCommand,
  RegisterAthleteCommand,
  SessionExerciseDto,
  SessionSetDto,
} from "../application/dto";
import { isExperienceLevel } from "../domain/athlete";
import type { ApplicationContainer } from "../infrastructure/composition-root";
import { err, ok, type Result } from "../shared/result";
import {
  asRecord,
  optionalString,
  recordArray,
  requiredNumber,
  requiredString,
  type DecodedRecord,
} from "./decode";

export type HttpVerb = "GET" | "POST";

export interface HttpRequest {
  readonly verb: HttpVerb;
  readonly path: string;
  readonly body?: unknown;
  readonly query: Readonly<Record<string, string>>;
}

export type ResponseStatus = 200 | 201 | 400 | 404 | 422 | 500;

export interface FailureProblem {
  readonly code: string;
  readonly explanation: string;
}

export type Envelope<TData> =
  | { readonly outcome: "success"; readonly data: TData }
  | { readonly outcome: "failure"; readonly problem: FailureProblem };

export interface HttpResponse<TData = unknown> {
  readonly status: ResponseStatus;
  readonly envelope: Envelope<TData>;
}

type RouteHandler = (
  request: HttpRequest,
  params: Readonly<Record<string, string>>,
) => Promise<HttpResponse>;

interface MountPoint {
  readonly matcher: RegExp;
  readonly keys: readonly string[];
  readonly handler: RouteHandler;
}

const assertNever = (value: never): never => {
  throw new Error(`unreachable branch reached: ${JSON.stringify(value)}`);
};

const succeed = <TData>(
  status: ResponseStatus,
  data: TData,
): HttpResponse<TData> => ({
  status,
  envelope: { outcome: "success", data },
});

const fail = (
  status: ResponseStatus,
  code: string,
  explanation: string,
): HttpResponse<never> => ({
  status,
  envelope: { outcome: "failure", problem: { code, explanation } },
});

export class ApiGateway {
  private readonly mounts = new Map<number, MountPoint[]>();

  mount(verb: HttpVerb, pattern: string, handler: RouteHandler): void {
    const segments = pattern.split("/").filter(Boolean);
    const keys = segments
      .filter((segment) => segment.startsWith(":"))
      .map((segment) => segment.slice(1));
    const source = segments
      .map((segment) => (segment.startsWith(":") ? "([^/]+)" : segment))
      .join("/");
    const point: MountPoint = {
      matcher: new RegExp(`^${source}$`),
      keys,
      handler,
    };
    const bucket = this.mounts.get(segments.length) ?? [];
    bucket.push(point);
    this.mounts.set(segments.length, bucket);
  }

  async serve(request: HttpRequest): Promise<HttpResponse> {
    try {
      const segments = request.path.split("/").filter(Boolean);
      const joinedPath = segments.join("/");
      for (const point of this.mounts.get(segments.length) ?? []) {
        const matched = point.matcher.exec(joinedPath);
        if (!matched) continue;
        const params: Record<string, string> = {};
        point.keys.forEach((key, position) => {
          params[key] = decodeURIComponent(matched[position + 1]);
        });
        return await point.handler(request, params);
      }
      return fail(
        404,
        "ROUTE_NOT_FOUND",
        `no handler mounted for ${request.verb} ${request.path}`,
      );
    } catch (cause) {
      return fail(
        500,
        "UNHANDLED_EXCEPTION",
        cause instanceof Error ? cause.message : "unexpected failure",
      );
    }
  }
}

const decodeSet = (raw: DecodedRecord): Result<SessionSetDto, string> => {
  const reps = requiredNumber(raw, "reps");
  if (!reps.success) return reps;
  const weightKg = requiredNumber(raw, "weightKg");
  if (!weightKg.success) return weightKg;
  const rpe = requiredNumber(raw, "rpe");
  if (!rpe.success) return rpe;
  return ok({ reps: reps.value, weightKg: weightKg.value, rpe: rpe.value });
};

const decodeExercise = (
  raw: DecodedRecord,
): Result<SessionExerciseDto, string> => {
  const exerciseId = requiredString(raw, "exerciseId");
  if (!exerciseId.success) return exerciseId;
  const sets = recordArray(raw, "sets");
  if (!sets.success) return sets;
  const decodedSets: SessionSetDto[] = [];
  for (const entry of sets.value) {
    const decodedSet = decodeSet(entry);
    if (!decodedSet.success) return decodedSet;
    decodedSets.push(decodedSet.value);
  }
  return ok({ exerciseId: exerciseId.value, sets: decodedSets });
};

const decodeLogSessionCommand = (
  body: unknown,
): Result<LogTrainingSessionCommand, string> => {
  const root = asRecord(body);
  if (!root.success) return root;
  const payload = root.value;
  const athleteId = requiredString(payload, "athleteId");
  if (!athleteId.success) return athleteId;
  const startedAtIso = requiredString(payload, "startedAtIso");
  if (!startedAtIso.success) return startedAtIso;
  const completedAtIso = requiredString(payload, "completedAtIso");
  if (!completedAtIso.success) return completedAtIso;
  const title = optionalString(payload, "title");
  if (!title.success) return title;
  const exercises = recordArray(payload, "exercises");
  if (!exercises.success) return exercises;
  const decodedExercises: SessionExerciseDto[] = [];
  for (const entry of exercises.value) {
    const decodedExercise = decodeExercise(entry);
    if (!decodedExercise.success) return decodedExercise;
    decodedExercises.push(decodedExercise.value);
  }
  return ok({
    athleteId: athleteId.value,
    title: title.value,
    startedAtIso: startedAtIso.value,
    completedAtIso: completedAtIso.value,
    exercises: decodedExercises,
  });
};

const decodeRegisterAthleteCommand = (
  body: unknown,
): Result<RegisterAthleteCommand, string> => {
  const root = asRecord(body);
  if (!root.success) return root;
  const payload = root.value;
  const displayName = requiredString(payload, "displayName");
  if (!displayName.success) return displayName;
  const rawExperience = requiredString(payload, "experience");
  if (!rawExperience.success) return rawExperience;
  if (!isExperienceLevel(rawExperience.value)) {
    return err("experience must be one of novice|intermediate|advanced|elite");
  }
  const bodyweightKg = requiredNumber(payload, "bodyweightKg");
  if (!bodyweightKg.success) return bodyweightKg;
  return ok({
    displayName: displayName.value,
    experience: rawExperience.value,
    bodyweightKg: bodyweightKg.value,
  });
};

const respondToFailure = (failure: ApplicationFailure): HttpResponse<never> => {
  switch (failure.code) {
    case "MALFORMED_INPUT":
      return fail(400, failure.code, failure.reason);
    case "UNKNOWN_ATHLETE":
      return fail(
        404,
        failure.code,
        `no athlete exists under "${failure.athleteId}"`,
      );
    case "UNKNOWN_EXERCISE":
      return fail(
        404,
        failure.code,
        `exercise "${failure.exerciseId}" is absent from the catalog`,
      );
    case "RULE_REJECTED":
      return fail(422, failure.code, failure.reason);
    default:
      return assertNever(failure);
  }
};

export const buildHttpApi = (container: ApplicationContainer): ApiGateway => {
  const gateway = new ApiGateway();

  gateway.mount("POST", "/athletes", async (request) => {
    const command = decodeRegisterAthleteCommand(request.body);
    if (!command.success) return fail(400, "INVALID_BODY", command.error);
    const outcome = await container.registerAthlete.execute(command.value);
    return outcome.success
      ? succeed(201, outcome.value)
      : respondToFailure(outcome.error);
  });

  gateway.mount("POST", "/training-sessions", async (request) => {
    const command = decodeLogSessionCommand(request.body);
    if (!command.success) return fail(400, "INVALID_BODY", command.error);
    const outcome = await container.logTrainingSession.execute(command.value);
    return outcome.success
      ? succeed(201, outcome.value)
      : respondToFailure(outcome.error);
  });

  gateway.mount(
    "GET",
    "/athletes/:athleteId/dashboard",
    async (request, params) => {
      const horizonRaw: string | undefined = request.query["horizonDays"];
      const horizonDays =
        horizonRaw === undefined ? 28 : Number.parseInt(horizonRaw, 10);
      if (!Number.isInteger(horizonDays)) {
        return fail(400, "INVALID_QUERY", "horizonDays must be an integer");
      }
      const outcome = await container.getTrainingDashboard.execute({
        athleteId: params["athleteId"],
        horizonDays,
      });
      return outcome.success
        ? succeed(200, outcome.value)
        : respondToFailure(outcome.error);
    },
  );

  return gateway;
};
