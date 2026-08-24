/**
 * Standalone Expo Haptics & Blur Native Module Toolkit
 * Combines native vibration feedbacks with glassmorphic blur preset configurations.
 */

import * as Haptics from "expo-haptics";

export const GLASS_BLUR_PRESETS = {
  lightCard: { intensity: 30, tint: "light" as const },
  darkModal: { intensity: 80, tint: "dark" as const },
  ultraThinSheet: { intensity: 50, tint: "regular" as const },
};

/**
 * Executes haptic feedback pattern for workout events
 */
export async function executeWorkoutHaptic(
  eventType: "set_success" | "timer_finish" | "pr_celebration" | "button_tap" | "warning"
) {
  try {
    switch (eventType) {
      case "button_tap":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;

      case "set_success":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;

      case "timer_finish":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;

      case "pr_celebration":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;

      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }
  } catch {
    // Unsupported platform fallback
  }
}
