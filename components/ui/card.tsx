import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import {
  BorderRadius,
  Spacing,
  gold,
  primary,
  semantic,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface CardProps extends ViewProps {
  variant?: "default" | "outlined" | "primary" | "gold" | "error";
  padding?: keyof typeof Spacing;
}

export function Card({
  children,
  style,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getVariantStyle = () => {
    switch (variant) {
      case "outlined":
        return isDark ? styles.outlinedDark : styles.outlinedLight;
      case "primary":
        return isDark ? styles.primaryDark : styles.primary;
      case "gold":
        return isDark ? styles.goldDark : styles.gold;
      case "error":
        return isDark ? styles.errorDark : styles.error;
      default:
        return isDark ? styles.defaultDark : styles.defaultLight;
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyle(),
        { padding: Spacing[padding] },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderCurve: "continuous",
    borderWidth: 2,
  },
  // Light mode - default (subtle border)
  defaultLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E8E8",
  },
  // Dark mode - default (subtle border)
  defaultDark: {
    backgroundColor: "#1C1E1F",
    borderColor: "#2A2D2E",
  },
  // Light mode - outlined (more visible border)
  outlinedLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
    borderLeftWidth: 2,
  },
  // Dark mode - outlined
  outlinedDark: {
    backgroundColor: "#1C1E1F",
    borderColor: "#3A3D3E",
    borderLeftWidth: 3,
  },
  // Primary variant (teal accent border)
  primary: {
    backgroundColor: "#FFFFFF",
    borderColor: primary[500],
    borderLeftWidth: 2,
  },
  primaryDark: {
    backgroundColor: "#1C1E1F",
    borderColor: primary[800],
    borderLeftWidth: 2,
  },
  // Gold variant (for achievements)
  gold: {
    backgroundColor: "#FFFBF0",
    borderColor: gold[300],
    borderLeftWidth: 2,
  },
  goldDark: {
    backgroundColor: "#1C1E1F",
    borderColor: gold[400],
    borderLeftWidth: 2,
  },
  // Error variant (for error states)
  error: {
    backgroundColor: "#FEF2F2",
    borderColor: semantic.error,
    borderLeftWidth: 2,
  },
  errorDark: {
    backgroundColor: "#1C1E1F",
    borderColor: semantic.error,
    borderLeftWidth: 2,
  },
});
