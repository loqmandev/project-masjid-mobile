// Fallback for using MaterialIcons on Android and web.

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

// FontAwesome6 icon names
type FontAwesomeIconName = keyof typeof FONTAWESOME_ICONS;

// Combined icon type
type AllIconNames = IconSymbolName | FontAwesomeIconName;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'magnifyingglass': 'search',
  'magnifyingglass.circle.fill': 'search',
  'checkmark.circle.fill': 'check-circle',
  'trophy.fill': 'emoji-events',
  'person.fill': 'person',
  // Actions
  'paperplane.fill': 'send',
  'square.and.arrow.up': 'share',
  'arrow.clockwise': 'refresh',
  'xmark.circle.fill': 'cancel',
  'plus': 'add',
  'chevron.right': 'chevron-right',
  'chevron.down': 'keyboard-arrow-down',
  'chevron.left.forwardslash.chevron.right': 'code',
  'gearshape.fill': 'settings',
  'star.fill': 'star',
  'line.3.horizontal.decrease.circle.fill': 'tune',
  'checkmark': 'check',
  // Location
  'location.fill': 'location-on',
  'arrow.triangle.turn.up.right.diamond.fill': 'directions',
  // Status
  'checkmark.seal.fill': 'verified',
  // Achievement/Journey icons
  'flame.fill': 'local-fire-department',
  'building.2.fill': 'apartment',
  'sparkles': 'auto-awesome',
  'map.fill': 'map',
  'medal.fill': 'military-tech',
  'hands.sparkles.fill': 'back-hand',
  'target': 'my-location',
} as IconMapping;

// Icons that should use FontAwesome6 instead of MaterialIcons
const FONTAWESOME_ICONS: Record<string, ComponentProps<typeof FontAwesome6>['name']> = {
  'mosque': 'mosque',
  'user': 'user',
  'star': 'star',
  'trophy': 'trophy',
  'medal': 'medal',
  'lock': 'lock',
  'google': 'google',
  'flame': 'fire',
  'building.2.fill': 'building',
  'sparkles': 'wand-magic-sparkles',
  'map.fill': 'map',
  'hands.sparkles.fill': 'hands-holding-circle',
  'target': 'crosshairs',
  'chevron.right': 'chevron-right',
  'magnifyingglass': 'magnifying-glass',
  'arrow.clockwise': 'rotate-right',
  'gearshape.fill': 'gear',
  'bell': 'bell',
  'checkmark': 'check',
  'location.fill': 'location-dot',
  'checkmark.circle.fill': 'circle-check',
  'camera.fill': 'camera',
  'checkmark.seal.fill': 'certificate',
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
  // Check if this icon should use FontAwesome6
  if (name in FONTAWESOME_ICONS) {
    return <FontAwesome6 color={color} size={size} name={FONTAWESOME_ICONS[name as FontAwesomeIconName]} style={style} />;
  }
  return <MaterialIcons color={color} size={size} name={MAPPING[name as IconSymbolName]} style={style} />;
}
