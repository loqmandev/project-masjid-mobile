import type { ReactNode } from "react";
import type { StyleProp, ViewStyle, AccessibilityProps } from "react-native";

import type { Uniforms } from "@shopify/react-native-skia";

interface IChromaRing extends AccessibilityProps {
  /** Width of the ring container */
  readonly width?: number;
  /** Height of the ring container */
  readonly height?: number;
  /** Border radius for rounded corners */
  readonly borderRadius?: number;
  /** Width of the animated border line */
  readonly borderWidth?: number;
  /** Animation speed multiplier (0.1 - 2.0) */
  readonly speed?: number;
  /** Base color (hex string) */
  readonly base?: string;
  /** Glow/highlight color (hex string) */
  readonly glow?: string;
  /** Background color inside the ring (transparent for no background) */
  readonly background?: string;
  /** Content to render inside the ring */
  readonly children?: ReactNode;
  /** Additional style props */
  readonly style?: StyleProp<ViewStyle>;
}

// currently using Uniforms from Skia to avoid ts issues.

// @ts-nocheck
interface IUniforms {
  iResolution: number[];
  iTime: number;
  borderWidth: number;
  borderRadius: number;
  speed: number;
  baseColor: [number, number, number];
  glowColor: [number, number, number];
}

export type { IChromaRing, IUniforms };
