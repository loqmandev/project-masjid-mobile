import type { TextStyle, ViewStyle } from "react-native";

export type SizePreset = "small" | "medium" | "large";

export interface SizeConfig {
  numberSize: number;
  labelSize: number;
  gap: number;
  separatorMargin: {
    horizontal: number;
  };
}

export interface AnimationConfig {
  characterDelay: number;
  characterEnterDuration: number;
  characterExitDuration: number;
  spring: {
    damping: number;
    stiffness: number;
  };
}

export interface CharacterAnimationParams {
  opacity: number;
  translateY: number;
  scale: number;
}

export interface CharacterProps {
  char: string;
  style: TextStyle;
  index: number;
  animationConfig: AnimationConfig;
  enterInitial: CharacterAnimationParams;
  enterFinal: CharacterAnimationParams;
  exitInitial: CharacterAnimationParams;
  exitFinal: CharacterAnimationParams;
}

export interface TextAnimationProps {
  text: string;
  style: TextStyle;
}

export interface TimeRemaining {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CountdownCustomization {
  numberSize?: number;
  labelSize?: number;
  numberColor?: string;
  labelColor?: string;
  separatorColor?: string;
  gap?: number;
  letterSpacing?: number;
  fontWeight?: TextStyle["fontWeight"];
  showLabels?: boolean;
  showDays?: boolean;
  showSeparators?: boolean;
  finishText?: string;
  onFinish?: () => void;
  containerStyle?: ViewStyle;
  numberStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export interface CountdownTimerProps {
  targetDate: Date;
  size?: SizePreset;
  customization?: CountdownCustomization;
}
