// Fallback for using MaterialIcons on Android and web.

import { FontAwesome6 } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";
import { MosqueIcon } from "./mosque-icon";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

// FontAwesome6 icon names
type FontAwesomeIconName = keyof typeof FONTAWESOME_ICONS;

// MaterialCommunityIcons icon names
type MaterialCommunityIconName = keyof typeof MATERIAL_COMMUNITY_ICONS;

// Combined icon type
type AllIconNames =
  | IconSymbolName
  | FontAwesomeIconName
  | MaterialCommunityIconName;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  magnifyingglass: "search",
  "magnifyingglass.circle.fill": "search",
  "checkmark.circle.fill": "check-circle",
  "trophy.fill": "emoji-events",
  "person.fill": "person",
  // Actions
  "paperplane.fill": "send",
  "square.and.arrow.up": "share",
  "arrow.clockwise": "refresh",
  "xmark.circle.fill": "cancel",
  plus: "add",
  "chevron.right": "chevron-right",
  "chevron.down": "keyboard-arrow-down",
  "chevron.left.forwardslash.chevron.right": "code",
  "gearshape.fill": "settings",
  "star.fill": "star",
  "line.3.horizontal.decrease.circle.fill": "tune",
  checkmark: "check",
  // Location
  "location.fill": "location-on",
  "arrow.triangle.turn.up.right.diamond.fill": "directions",
  // Status
  "checkmark.seal.fill": "verified",
  trophy: "emoji-events",
  // Achievement/Journey icons
  "flame.fill": "local-fire-department",
  "building.2.fill": "apartment",
  sparkles: "auto-awesome",
  "map.fill": "map",
  "medal.fill": "military-tech",
  "hands.sparkles.fill": "back-hand",
  target: "my-location",
  // Settings icons
  "bell.fill": "notifications",
  "clock.fill": "access-time",
  "eye.fill": "visibility",
  "trash.fill": "delete",
  "info.circle.fill": "info",
  "doc.text.fill": "description",
  "lock.shield.fill": "security",
  "envelope.fill": "email",
  // Facility icons
  "person.praying": "mosque",
  snowflake: "ac-unit",
  "person.wave.2": "diversity-3",
  "drop.fill": "water-drop",
  wheelchair: "accessible",
  "figure.w.cafe.and.toilet": "wc",
  "local.parking": "local-parking",
  "water.drop": "water-drop",
  cpu: "devices",
  "chair.lounge.fill": "event-seat",
  calendar: "event",
  "pin.circle.fill": "place",
} as IconMapping;

// Icons that should use FontAwesome6 instead of MaterialIcons
const FONTAWESOME_ICONS: Record<
  string,
  ComponentProps<typeof FontAwesome6>["name"]
> = {
  user: "user",
  star: "star",
  trophy: "trophy",
  medal: "medal",
  lock: "lock",
  flame: "fire",
  sparkles: "wand-magic-sparkles",
  "chevron.right": "chevron-right",
  magnifyingglass: "magnifying-glass",
  "arrow.clockwise": "rotate-right",
  "gearshape.fill": "gear",
  bell: "bell",
  checkmark: "check",
  "camera.fill": "camera",
};

// Icons that should use MaterialCommunityIcons
const MATERIAL_COMMUNITY_ICONS: Record<
  string,
  ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  mosque: "mosque",
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: AllIconNames;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // Use custom mosque icon
  if (name === "mosque") {
    return <MosqueIcon size={size} color={color as string} style={style} />;
  }

  // Check if this icon should use MaterialCommunityIcons
  if (name in MATERIAL_COMMUNITY_ICONS) {
    return (
      <MaterialCommunityIcons
        color={color}
        size={size}
        name={MATERIAL_COMMUNITY_ICONS[name as MaterialCommunityIconName]}
        style={style}
      />
    );
  }

  // Check if this icon should use FontAwesome6
  if (name in FONTAWESOME_ICONS) {
    return (
      <FontAwesome6
        color={color}
        size={size}
        name={FONTAWESOME_ICONS[name as FontAwesomeIconName]}
        style={style}
      />
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name as IconSymbolName]}
      style={style}
    />
  );
}
