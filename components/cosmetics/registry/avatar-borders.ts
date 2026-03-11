/**
 * Avatar Border Cosmetic Definitions
 * Predefined avatar border configurations using ChromaRing
 */

import type { CosmeticDefinition } from "@/types/cosmetics";

/**
 * Default avatar border - subtle dark gray with minimal glow
 */
export const AVATAR_BORDER_DEFAULT: CosmeticDefinition = {
  id: "avatar_border_default",
  name: "Default",
  type: "avatar_border",
  rarity: "common",
  description: "A subtle dark border",
  isDefault: true,
  config: {
    base: "#333340",
    glow: "#0a0a0a",
    speed: 0.8,
    borderWidth: 4,
  },
};

/**
 * Teal Glow - matches app primary color
 */
export const AVATAR_BORDER_TEAL: CosmeticDefinition = {
  id: "avatar_border_teal",
  name: "Teal Glow",
  type: "avatar_border",
  rarity: "common",
  description: "A calming teal border",
  config: {
    base: "#00A9A5",
    glow: "#00D9D5",
    speed: 1.0,
    borderWidth: 4,
  },
};

/**
 * Golden - warm gold tones
 */
export const AVATAR_BORDER_GOLD: CosmeticDefinition = {
  id: "avatar_border_gold",
  name: "Golden",
  type: "avatar_border",
  rarity: "rare",
  description: "A prestigious golden border",
  config: {
    base: "#B8860B",
    glow: "#FFD700",
    speed: 0.9,
    borderWidth: 4,
  },
};

/**
 * Chromatic - rainbow shifting colors
 */
export const AVATAR_BORDER_RAINBOW: CosmeticDefinition = {
  id: "avatar_border_rainbow",
  name: "Chromatic",
  type: "avatar_border",
  rarity: "epic",
  description: "A mesmerizing rainbow border",
  config: {
    base: "#FF6B6B",
    glow: "#4ECDC4",
    speed: 1.5,
    borderWidth: 5,
  },
};

/**
 * Legendary - premium gold with sparkle effect
 */
export const AVATAR_BORDER_LEGENDARY: CosmeticDefinition = {
  id: "avatar_border_legendary",
  name: "Legendary",
  type: "avatar_border",
  rarity: "legendary",
  description: "The ultimate legendary border",
  config: {
    base: "#FFD700",
    glow: "#FFFFFF",
    speed: 1.2,
    borderWidth: 6,
  },
};

/**
 * All avatar border definitions
 */
export const AVATAR_BORDERS: CosmeticDefinition[] = [
  AVATAR_BORDER_DEFAULT,
  AVATAR_BORDER_TEAL,
  AVATAR_BORDER_GOLD,
  AVATAR_BORDER_RAINBOW,
  AVATAR_BORDER_LEGENDARY,
];

/**
 * Get avatar border by ID
 */
export function getAvatarBorderById(
  id: string,
): CosmeticDefinition | undefined {
  return AVATAR_BORDERS.find((border) => border.id === id);
}
