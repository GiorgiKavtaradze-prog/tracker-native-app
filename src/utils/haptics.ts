/**
 * Expo Haptics & Visual Blur Helper Wrapper
 * High-level API for triggering native haptic feedback and glassmorphic blur states.
 */

import * as Haptics from "expo-haptics";

/**
 * Triggers light impact haptic feedback (ideal for tab presses or button taps)
 */
export async function triggerLightHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Graceful fallback on web or unsupported devices
  }
}

/**
 * Triggers medium impact haptic feedback (ideal for logging a set)
 */
export async function triggerMediumHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

/**
 * Triggers heavy impact haptic feedback (ideal for finishing a workout)
 */
export async function triggerHeavyHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
}

/**
 * Triggers success notification haptic feedback (ideal for PRs)
 */
export async function triggerSuccessHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

/**
 * Triggers warning/error notification haptic feedback
 */
export async function triggerErrorHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
}
