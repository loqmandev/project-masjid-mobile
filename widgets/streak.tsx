import { Text, VStack, Image } from "@expo/ui/swift-ui";
import {
  padding,
  frame,
  background,
  foregroundStyle,
  font,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetBase } from "expo-widgets";

type StreakProps = {
  currentStreak: number;
  longestStreak: number;
  lastVisitDate: string; // ISO date string
};

function StreakWidget(props: WidgetBase<StreakProps>) {
  "widget";

  const streakColor = props.currentStreak > 0 ? "#FF6B35" : "#9E9E9E";

  return (
    <VStack
      alignment="center"
      spacing={6}
      modifiers={[
        padding({ all: 16 }),
        frame({ maxWidth: 9999, maxHeight: 9999 }),
        background("#F5F5F7"),
      ]}
    >
      <Image systemName="flame.fill" size={24} color={streakColor} />
      <Text
        modifiers={[
          font({ size: 36, weight: "bold" }),
          foregroundStyle(streakColor),
        ]}
      >
        {String(props.currentStreak)}
      </Text>
      <Text
        modifiers={[
          font({ size: 13, weight: "medium" }),
          foregroundStyle("#9E9E9E"),
        ]}
      >
        day streak
      </Text>
      {props.longestStreak > props.currentStreak && (
        <Text modifiers={[font({ size: 11 }), foregroundStyle("#BDBDBD")]}>
          Best: {props.longestStreak}
        </Text>
      )}
    </VStack>
  );
}

export default createWidget("StreakWidget", StreakWidget);
