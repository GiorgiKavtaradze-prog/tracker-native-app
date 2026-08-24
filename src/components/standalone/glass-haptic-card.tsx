import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

interface GlassHapticCardProps {
  title?: string;
  subtitle?: string;
  onPressAction?: () => void;
  className?: string;
}

/**
 * Standalone Glassmorphic Card Component featuring expo-blur and expo-haptics.
 */
export default function GlassHapticCard({
  title = "Glassmorphic Haptic Card",
  subtitle = "Tap to trigger native haptic impact and frosted glass blur effect.",
  onPressAction,
  className = "",
}: GlassHapticCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = async () => {
    setIsPressed(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handlePressOut = async () => {
    setIsPressed(false);
  };

  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (onPressAction) onPressAction();
  };

  return (
    <Pressable
      className={`overflow-hidden rounded-3xl border border-white/20 shadow-lg ${
        isPressed ? "scale-98 opacity-90" : "scale-100"
      } ${className}`}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 40 : 80}
        tint="dark"
        className="p-5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-inter-bold text-[17px] text-white">
              {title}
            </Text>
            <Text className="mt-1 font-inter text-[12px] text-white/70">
              {subtitle}
            </Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20 border border-white/30">
            <Text className="font-inter-bold text-[14px] text-white">⚡</Text>
          </View>
        </View>
      </BlurView>
    </Pressable>
  );
}
