export interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints: number[];
  enableBackdrop?: boolean;
  backdropOpacity?: number;
  dismissOnBackdropPress?: boolean;
  dismissOnSwipeDown?: boolean;
  onSnapPointChange?: (index: number) => void;
  onClose?: () => void;
  springConfig?: SpringConfig;
  sheetStyle?: any;
  backdropStyle?: any;
  handleStyle?: any;
  showHandle?: boolean;
  enableOverDrag?: boolean;
  enableHapticFeedback?: boolean;
  snapVelocityThreshold?: number;
  backgroundColor?: string;
  borderRadius?: number;
  contentContainerStyle?: any;
  enableDynamicSizing?: boolean;
}

export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
}

export type BottomSheetRef = React.RefObject<BottomSheetMethods | null>;

export interface BottomSheetMethods {
  snapToIndex: (index: number) => void;
  snapToPosition: (position: number) => void;
  expand: () => void;
  collapse: () => void;
  close: () => void;
  getCurrentIndex: () => number;
}
