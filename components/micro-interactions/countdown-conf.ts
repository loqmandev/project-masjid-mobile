import type { AnimationConfig, CharacterAnimationParams, SizeConfig, SizePreset } from "./countdown-types";

export const SIZE_PRESETS: Record<SizePreset, SizeConfig> = {
  small: {
    numberSize: 24,
    labelSize: 10,
    gap: 8,
    separatorMargin: {
      horizontal: 4,
    },
  },
  medium: {
    numberSize: 36,
    labelSize: 12,
    gap: 12,
    separatorMargin: {
      horizontal: 6,
    },
  },
  large: {
    numberSize: 48,
    labelSize: 14,
    gap: 16,
    separatorMargin: {
      horizontal: 8,
    },
  },
};

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  characterDelay: 15,
  characterEnterDuration: 100,
  characterExitDuration: 80,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

export const ENTER_INITIAL: CharacterAnimationParams = {
  opacity: 0,
  translateY: -16,
  scale: 1,
};

export const ENTER_FINAL: CharacterAnimationParams = {
  opacity: 1,
  translateY: 0,
  scale: 1,
};

export const EXIT_INITIAL: CharacterAnimationParams = {
  opacity: 1,
  translateY: 0,
  scale: 1,
};

export const EXIT_FINAL: CharacterAnimationParams = {
  opacity: 0,
  translateY: 16,
  scale: 1,
};
