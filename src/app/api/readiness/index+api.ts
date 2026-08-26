import { toAppErrorPayload } from "@/core/domain-error";
import {
  createReadinessModule,
  toReadinessPayload,
} from "@/features/readiness";
import type { AppContainer } from "@/infrastructure";
import { createAppContainer } from "@/infrastructure";
import { auth } from "@/lib/auth";

type ReadinessModule = ReturnType<typeof createReadinessModule>;

const globalForReadiness = globalThis as unknown as {
  __readinessModule?: ReadinessModule;
};

function getReadinessModule(): ReadinessModule {
  if (!globalForReadiness.__readinessModule) {
    const container: AppContainer = createAppContainer();
    globalForReadiness.__readinessModule = createReadinessModule({
      progress: container.ports.progress,
    });
  }
  return globalForReadiness.__readinessModule;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const rawQuery = {
    windowDays: url.searchParams.get("windowDays") ?? undefined,
    acuteDays: url.searchParams.get("acuteDays") ?? undefined,
    chronicDays: url.searchParams.get("chronicDays") ?? undefined,
    profile: url.searchParams.get("profile") ?? undefined,
  };

  const result = await getReadinessModule().service.evaluateFromRawInput(
    session.user.id,
    rawQuery,
  );

  if (!result.ok) {
    return Response.json(toAppErrorPayload(result.error), {
      status: result.error.status,
    });
  }

  return Response.json(toReadinessPayload(result.value), {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
