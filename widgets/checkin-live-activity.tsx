import { Text, VStack, HStack, Image } from "@expo/ui/swift-ui";
import {
  padding,
  foregroundStyle,
  font,
  lineLimit,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity } from "expo-widgets";

type CheckInLiveActivityProps = {
  masjidName: string;
  remainingSeconds: number;
  isPrayerTime: boolean;
  prayerName: string;
  estimatedPoints: number;
  isReadyToCheckout: boolean;
};

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function CheckInLiveActivity(props?: CheckInLiveActivityProps) {
  "widget";

  const data = props ?? {
    masjidName: "",
    remainingSeconds: 0,
    isPrayerTime: false,
    prayerName: "",
    estimatedPoints: 0,
    isReadyToCheckout: false,
  };

  const countdown = formatCountdown(data.remainingSeconds);
  const teal = "#00A9A5";
  const gold = "#FFCC00";

  return {
    compactLeading: (
      <Image systemName="building.columns.fill" size={14} color={teal} />
    ),

    compactTrailing: data.isReadyToCheckout ? (
      <Image systemName="checkmark.circle.fill" size={14} color={teal} />
    ) : (
      <Text
        modifiers={[
          font({ size: 14, weight: "semibold", design: "monospaced" }),
          foregroundStyle(teal),
        ]}
      >
        {countdown}
      </Text>
    ),

    minimal: data.isReadyToCheckout ? (
      <Image systemName="checkmark.circle.fill" size={12} color={teal} />
    ) : (
      <Text
        modifiers={[
          font({ size: 12, design: "monospaced" }),
          foregroundStyle(teal),
        ]}
      >
        {countdown}
      </Text>
    ),

    banner: (
      <VStack spacing={12} modifiers={[padding({ all: 16 })]}>
        {/* Header */}
        <HStack spacing={8}>
          <Image systemName="building.columns.fill" size={18} color={teal} />
          <Text
            modifiers={[
              font({ size: 15, weight: "semibold" }),
              foregroundStyle("#212121"),
              lineLimit(1),
            ]}
          >
            {data.masjidName}
          </Text>
        </HStack>

        {/* Countdown or Ready state */}
        {data.isReadyToCheckout ? (
          <VStack spacing={4} alignment="center">
            <Image
              systemName="checkmark.circle.fill"
              size={36}
              color={teal}
            />
            <Text
              modifiers={[
                font({ size: 17, weight: "bold" }),
                foregroundStyle(teal),
              ]}
            >
              Ready to checkout
            </Text>
          </VStack>
        ) : (
          <VStack spacing={4} alignment="center">
            <Text
              modifiers={[
                font({ size: 36, weight: "bold", design: "monospaced" }),
                foregroundStyle(teal),
              ]}
            >
              {countdown}
            </Text>
            <Text modifiers={[font({ size: 13 }), foregroundStyle("#9E9E9E")]}>
              remaining
            </Text>
          </VStack>
        )}

        {/* Bottom row: points + prayer badge */}
        <HStack spacing={12}>
          <HStack spacing={4}>
            <Image systemName="star.fill" size={12} color={gold} />
            <Text
              modifiers={[
                font({ size: 13, weight: "medium" }),
                foregroundStyle("#212121"),
              ]}
            >
              ~{data.estimatedPoints} pts
            </Text>
          </HStack>
          {data.isPrayerTime && (
            <HStack spacing={4}>
              <Image systemName="moon.stars.fill" size={12} color={gold} />
              <Text
                modifiers={[
                  font({ size: 13, weight: "medium" }),
                  foregroundStyle(gold),
                ]}
              >
                {data.prayerName}
              </Text>
            </HStack>
          )}
        </HStack>
      </VStack>
    ),
  };
}

export default createLiveActivity("CheckInLiveActivity", CheckInLiveActivity);
