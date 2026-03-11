import { Text, VStack, HStack, Image } from "@expo/ui/swift-ui";
import {
  padding,
  frame,
  background,
  foregroundStyle,
  font,
  lineLimit,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetBase } from "expo-widgets";

type NearbyMasjidProps = {
  masjidName: string;
  distanceM: number;
  district: string;
  canCheckin: boolean;
  isEmpty: boolean;
  emptyReason: string; // "no_location" | "no_masjids" | ""
};

function NearbyMasjidWidget(props: WidgetBase<NearbyMasjidProps>) {
  "widget";

  if (props.isEmpty) {
    const message =
      props.emptyReason === "no_location"
        ? "Enable location"
        : "No masjids nearby";

    if (props.family === "systemSmall") {
      return (
        <VStack
          modifiers={[
            padding({ all: 16 }),
            frame({ maxWidth: 9999, maxHeight: 9999 }),
            background("#F5F5F7"),
          ]}
        >
          <Image systemName="location.slash" size={28} color="#9E9E9E" />
          <Text
            modifiers={[
              font({ size: 13, weight: "medium" }),
              foregroundStyle("#9E9E9E"),
            ]}
          >
            {message}
          </Text>
        </VStack>
      );
    }

    return (
      <HStack
        spacing={12}
        modifiers={[
          padding({ all: 16 }),
          frame({ maxWidth: 9999, maxHeight: 9999 }),
          background("#F5F5F7"),
        ]}
      >
        <Image systemName="location.slash" size={28} color="#9E9E9E" />
        <VStack alignment="leading" spacing={4}>
          <Text
            modifiers={[
              font({ size: 15, weight: "semibold" }),
              foregroundStyle("#212121"),
            ]}
          >
            {message}
          </Text>
          <Text
            modifiers={[font({ size: 13 }), foregroundStyle("#9E9E9E")]}
          >
            Open app to get started
          </Text>
        </VStack>
      </HStack>
    );
  }

  const distanceLabel =
    props.distanceM >= 1000
      ? `${(props.distanceM / 1000).toFixed(1)}km`
      : `${props.distanceM}m`;

  const statusLabel = props.canCheckin ? "Ready to check in" : "Tap to explore";
  const accentColor = props.canCheckin ? "#00A9A5" : "#9E9E9E";

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
          <Image systemName="building.columns" size={14} color={accentColor} />
          <Text
            modifiers={[
              font({ size: 11, weight: "medium" }),
              foregroundStyle(accentColor),
            ]}
          >
            {distanceLabel}
          </Text>
        </HStack>
        <Text
          modifiers={[
            font({ size: 15, weight: "semibold" }),
            foregroundStyle("#212121"),
            lineLimit(2),
          ]}
        >
          {props.masjidName}
        </Text>
        {props.canCheckin && (
          <Text
            modifiers={[
              font({ size: 11, weight: "medium" }),
              foregroundStyle(accentColor),
            ]}
          >
            {statusLabel}
          </Text>
        )}
      </VStack>
    );
  }

  // systemMedium
  return (
    <VStack
      alignment="leading"
      spacing={4}
      modifiers={[
        padding({ all: 16 }),
        frame({ maxWidth: 9999, maxHeight: 9999 }),
        background("#F5F5F7"),
      ]}
    >
      <HStack spacing={6}>
        <Image systemName="building.columns" size={14} color={accentColor} />
        <Text
          modifiers={[
            font({ size: 11, weight: "medium" }),
            foregroundStyle(accentColor),
          ]}
        >
          {distanceLabel}
        </Text>
      </HStack>
      <Text
        modifiers={[
          font({ size: 17, weight: "semibold" }),
          foregroundStyle("#212121"),
          lineLimit(1),
        ]}
      >
        {props.masjidName}
      </Text>
      <Text modifiers={[font({ size: 13 }), foregroundStyle("#9E9E9E")]}>
        {props.district}
      </Text>
      <Text
        modifiers={[
          font({ size: 13, weight: "medium" }),
          foregroundStyle(accentColor),
        ]}
      >
        {statusLabel}
      </Text>
    </VStack>
  );
}

export default createWidget("NearbyMasjidWidget", NearbyMasjidWidget);
