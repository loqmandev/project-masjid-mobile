import { Text, VStack, HStack, Image } from "@expo/ui/swift-ui";
import {
  padding,
  frame,
  background,
  foregroundStyle,
  font,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetBase } from "expo-widgets";

type ProfileSummaryProps = {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalPoints: number;
  uniqueMasjidsVisited: number;
  currentStreak: number;
  achievementCount: number;
};

function ProfileSummaryWidget(props: WidgetBase<ProfileSummaryProps>) {
  "widget";

  const xpProgress = `${props.currentXP}/${props.nextLevelXP} XP`;

  if (props.family === "systemSmall") {
    return (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[
          padding({ all: 16 }),
          frame({ maxWidth: 9999, maxHeight: 9999 }),
          background("#F5F5F7"),
        ]}
      >
        <HStack spacing={6}>
          <Image systemName="star.circle.fill" size={16} color="#FFCC00" />
          <Text
            modifiers={[
              font({ size: 13, weight: "medium" }),
              foregroundStyle("#9E9E9E"),
            ]}
          >
            Level {props.level}
          </Text>
        </HStack>
        <Text
          modifiers={[
            font({ size: 32, weight: "bold" }),
            foregroundStyle("#00A9A5"),
          ]}
        >
          {props.totalPoints.toLocaleString()}
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle("#9E9E9E")]}>
          {xpProgress}
        </Text>
        <HStack spacing={12}>
          <HStack spacing={4}>
            <Image systemName="flame.fill" size={12} color="#FF6B35" />
            <Text
              modifiers={[
                font({ size: 13, weight: "semibold" }),
                foregroundStyle("#212121"),
              ]}
            >
              {String(props.currentStreak)}
            </Text>
          </HStack>
          <HStack spacing={4}>
            <Image systemName="building.columns" size={12} color="#00A9A5" />
            <Text
              modifiers={[
                font({ size: 13, weight: "semibold" }),
                foregroundStyle("#212121"),
              ]}
            >
              {String(props.uniqueMasjidsVisited)}
            </Text>
          </HStack>
        </HStack>
      </VStack>
    );
  }

  // systemMedium
  return (
    <HStack
      spacing={16}
      modifiers={[
        padding({ all: 16 }),
        frame({ maxWidth: 9999, maxHeight: 9999 }),
        background("#F5F5F7"),
      ]}
    >
      {/* Left side - Level */}
      <VStack spacing={4} alignment="center">
        <Image systemName="star.circle.fill" size={28} color="#FFCC00" />
        <Text
          modifiers={[
            font({ size: 28, weight: "bold" }),
            foregroundStyle("#00A9A5"),
          ]}
        >
          {String(props.level)}
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle("#9E9E9E")]}>
          {xpProgress}
        </Text>
      </VStack>

      {/* Right side - 2x2 stat grid */}
      <VStack spacing={12}>
        <HStack spacing={24}>
          <VStack spacing={2}>
            <HStack spacing={4}>
              <Image systemName="trophy.fill" size={12} color="#00A9A5" />
              <Text
                modifiers={[
                  font({ size: 17, weight: "bold" }),
                  foregroundStyle("#212121"),
                ]}
              >
                {props.totalPoints.toLocaleString()}
              </Text>
            </HStack>
            <Text modifiers={[font({ size: 11 }), foregroundStyle("#9E9E9E")]}>
              Points
            </Text>
          </VStack>
          <VStack spacing={2}>
            <HStack spacing={4}>
              <Image systemName="building.columns" size={12} color="#00A9A5" />
              <Text
                modifiers={[
                  font({ size: 17, weight: "bold" }),
                  foregroundStyle("#212121"),
                ]}
              >
                {String(props.uniqueMasjidsVisited)}
              </Text>
            </HStack>
            <Text modifiers={[font({ size: 11 }), foregroundStyle("#9E9E9E")]}>
              Masjids
            </Text>
          </VStack>
        </HStack>
        <HStack spacing={24}>
          <VStack spacing={2}>
            <HStack spacing={4}>
              <Image systemName="flame.fill" size={12} color="#00A9A5" />
              <Text
                modifiers={[
                  font({ size: 17, weight: "bold" }),
                  foregroundStyle("#212121"),
                ]}
              >
                {String(props.currentStreak)}
              </Text>
            </HStack>
            <Text modifiers={[font({ size: 11 }), foregroundStyle("#9E9E9E")]}>
              Streak
            </Text>
          </VStack>
          <VStack spacing={2}>
            <HStack spacing={4}>
              <Image systemName="medal.fill" size={12} color="#00A9A5" />
              <Text
                modifiers={[
                  font({ size: 17, weight: "bold" }),
                  foregroundStyle("#212121"),
                ]}
              >
                {String(props.achievementCount)}
              </Text>
            </HStack>
            <Text modifiers={[font({ size: 11 }), foregroundStyle("#9E9E9E")]}>
              Awards
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </HStack>
  );
}

export default createWidget("ProfileSummaryWidget", ProfileSummaryWidget);
