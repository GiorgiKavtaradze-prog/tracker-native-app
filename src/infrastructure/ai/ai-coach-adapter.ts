/**
 * AI coach adapter — implements the application-layer `AICoachProvider` port
 * using the Vercel AI SDK (`google/gemini-2.5-flash`), mirroring the exact
 * model/wiring already used by the `exercises/[id]/instructions` route so the
 * project stays consistent with its Expo SDK 57 / Vercel AI SDK 7 setup.
 *
 * Swapping models or vendors only requires changing this one file.
 */
import { generateText } from "ai";
import { InfrastructureError } from "@/core/domain-error";
import type { AICoachProvider, CoachingReply } from "@/application/ports";

export class GeminiAICoachProvider implements AICoachProvider {
  constructor(
    private readonly options: { model?: string; systemPrompt?: string } = {},
  ) {}

  async ask(prompt: { system: string; user: string }): Promise<CoachingReply> {
    try {
      const { text } = await generateText({
        model: this.options.model ?? "google/gemini-2.5-flash",
        system: prompt.system,
        prompt: prompt.user,
      });
      return { content: text };
    } catch (cause) {
      throw new InfrastructureError("AI coaching request failed", cause);
    }
  }
}

/**
 * Deterministic fallback provider (no network calls) — handy in tests and as a
 * graceful-degradation path when no model key is configured.
 */
export class RuleBasedCoachProvider implements AICoachProvider {
  async ask(prompt: { system: string; user: string }): Promise<CoachingReply> {
    const lines = prompt.user
      .split("\n")
      .filter((line) => line.trim().length > 0);
    const summary = lines.slice(0, 3).join(" · ");
    return {
      content: `Rule-based coach (AI unavailable). Context received: ${summary || "none"}.`,
    };
  }
}
