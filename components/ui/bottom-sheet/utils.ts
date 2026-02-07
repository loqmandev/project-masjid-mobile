import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function parseSnapPoint(snapPoint: number | string): number {
  if (typeof snapPoint === 'number') {
    return snapPoint;
  }
  // Parse percentage string like "50%"
  if (typeof snapPoint === 'string' && snapPoint.endsWith('%')) {
    const percentage = parseFloat(snapPoint);
    return (percentage / 100) * SCREEN_HEIGHT;
  }
  // Parse dimension string like "300px"
  if (typeof snapPoint === 'string' && snapPoint.endsWith('px')) {
    return parseFloat(snapPoint);
  }
  return snapPoint as number;
}

export function triggerHaptic() {
  // Haptic feedback can be enabled with expo-haptics if needed
  // For now, this is a placeholder
}

export function isScrollableList(child: any): boolean {
  if (!child || typeof child !== 'object') {
    return false;
  }
  const type = child.type?.name || child.type?.displayName || '';
  return (
    type === 'FlatList' ||
    type === 'ScrollView' ||
    type === 'SectionList' ||
    type === 'VirtualizedList'
  );
}
