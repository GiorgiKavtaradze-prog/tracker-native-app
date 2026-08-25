import Button from "@/components/ui/button";
import { useAppThemeColor } from "@/theme/app-theme";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const bgImg = require("../../../assets/images/app-images/welcome-background.png");

const onboardingHref = {
  pathname: "/onboarding/[step]",
  params: { step: "gender" },
} as const;

const Welcome = () => {
  const primaryForeground = useAppThemeColor("primaryForeground");

  return (
    <ImageBackground
      className="relative flex-1 overflow-hidden"
      resizeMode="stretch"
      source={bgImg}
      accessibilityIgnoresInvertColors
    >
      <View className="absolute inset-0 bg-black/20" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-5 pb-4 pt-2">
          <View className="items-center mt-32">
            <Text className="-mt-2 font-inter-bold text-[30px] tracking-[-0.8px] text-white">
              MyWorkout
            </Text>
            <Text className="mt-1 font-inter text-[13px] text-white/70">
              Track. Train. Transform.
            </Text>
          </View>

          <View className="flex-grow items-center overflow-hidden" />

          <View className="items-center">
            <Text className="text-center font-inter-bold text-[30px] leading-9 tracking-[-0.8px] text-white">
              Stronger Every Workout.
            </Text>
            <Text className="mt-2 text-center font-inter text-[15px] text-white/70">
              Build muscle. Track every rep.
            </Text>
          </View>

          <Link href={onboardingHref} asChild>
            <Button
              className="mt-6"
              rightIcon={
                <View className="absolute right-5">
                  <Feather
                    color={primaryForeground}
                    name="arrow-right"
                    size={23}
                  />
                </View>
              }
            >
              Get Started
            </Button>
          </Link>

          <View className="mt-3 flex-row items-center justify-center">
            <Text className="font-inter text-[13px] text-white/70">
              Already have an account?{" "}
            </Text>
            <Link href="/sign-in" asChild>
              <Pressable
                accessibilityRole="link"
                className="min-h-11 justify-center px-1"
              >
                <Text className="font-inter-semibold text-[13px] text-primary">
                  Sign In
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Welcome;
