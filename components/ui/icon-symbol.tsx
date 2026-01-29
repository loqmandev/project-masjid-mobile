// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

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
  // Location
  'location.fill': 'location-on',
  'arrow.triangle.turn.up.right.diamond.fill': 'directions',
  // Status
  'checkmark.seal.fill': 'verified',
} as IconMapping;

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
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
