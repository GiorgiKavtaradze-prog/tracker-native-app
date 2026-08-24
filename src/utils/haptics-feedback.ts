/**
 * Native Haptic Vibration Feedback Pattern Manager Utility
 * Formats custom haptic feedback patterns for workout events, rest timers, and PR celebrations.
 */

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "pr_celebration";

export interface HapticPatternStep {
  delayMs: number;
  type: HapticType;
}

/**
 * Returns preset haptic vibration sequences for workout app events
 */
export function getHapticPatternForEvent(
  event:
    "set_completed" | "rest_finished" | "pr_broken" | "timer_tick" | "error",
): HapticPatternStep[] {
  switch (event) {
    case "timer_tick":
      return [{ delayMs: 0, type: "light" }];

    case "set_completed":
      return [
        { delayMs: 0, type: "medium" },
        { delayMs: 150, type: "light" },
      ];

    case "rest_finished":
      return [
        { delayMs: 0, type: "heavy" },
        { delayMs: 100, type: "heavy" },
        { delayMs: 200, type: "success" },
      ];

    case "pr_broken":
      return [
        { delayMs: 0, type: "heavy" },
        { delayMs: 120, type: "heavy" },
        { delayMs: 240, type: "success" },
        { delayMs: 400, type: "pr_celebration" },
      ];

    case "error":
      return [
        { delayMs: 0, type: "error" },
        { delayMs: 100, type: "error" },
      ];

    default:
      return [{ delayMs: 0, type: "light" }];
  }
}
