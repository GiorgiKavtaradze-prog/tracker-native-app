import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

interface GlassTimerModalProps {
  visible: boolean;
  initialSeconds?: number;
  onClose: () => void;
  onTimerComplete?: () => void;
}

/**
 * Standalone Glassmorphic Rest Timer Modal utilizing expo-blur and expo-haptics.
 */
export default function GlassTimerModal({
  visible,
  initialSeconds = 60,
  onClose,
  onTimerComplete,
}: GlassTimerModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (!visible) {
      setSecondsLeft(initialSeconds);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerFinishHaptic();
          if (onTimerComplete) onTimerComplete();
          return 0;
        }

        // Haptic tick on last 3 seconds
        if (prev <= 4) {
          triggerTickHaptic();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, initialSeconds]);

  const triggerTickHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const triggerFinishHaptic = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <BlurView
          className="w-full overflow-hidden rounded-3xl border border-white/20 p-6 items-center"
          intensity={Platform.OS === "ios" ? 50 : 90}
          tint="dark"
        >
          <Text className="font-inter-semibold text-[13px] text-white/70 uppercase tracking-widest">
            Rest Period
          </Text>

          <Text className="my-4 font-inter-bold text-[48px] text-white tracking-tight">
            {formatTime(secondsLeft)}
          </Text>

          <View className="flex-row gap-3 mt-2 w-full">
            <Pressable
              className="flex-1 rounded-2xl border border-white/20 bg-white/10 py-3 items-center active:bg-white/20"
              onPress={async () => {
                try {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
                setSecondsLeft((s) => s + 30);
              }}
            >
              <Text className="font-inter-semibold text-[13px] text-white">
                +30s
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 rounded-2xl bg-white py-3 items-center active:opacity-90"
              onPress={async () => {
                try {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onClose();
              }}
            >
              <Text className="font-inter-bold text-[13px] text-black">
                Skip Rest
              </Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}
