/**
 * Cosmetic System Types
 * Types for the equippable cosmetic system for profile cards
 */

/**
 * Types of cosmetics available
 */
export type CosmeticType =
  | "avatar_border"
  | "card_border"
  | "card_background"
  | "badge";

/**
 * Rarity levels for cosmetics
 */
export type CosmeticRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

/**
 * Configuration for ChromaRing-based avatar borders
 */
export interface AvatarBorderConfig {
  /** Base color of the border */
  base: string;
  /** Glow/highlight color */
  glow: string;
  /** Animation speed (0.1 - 2.0) */
  speed: number;
  /** Border width in pixels */
  borderWidth: number;
}

/**
 * Full definition of a cosmetic item
 */
export interface CosmeticDefinition {
  /** Unique identifier for the cosmetic */
  id: string;
  /** Display name */
  name: string;
  /** Type of cosmetic */
  type: CosmeticType;
  /** Rarity level */
  rarity: CosmeticRarity;
  /** Description of the cosmetic */
  description: string;
  /** Configuration specific to the cosmetic type */
  config: AvatarBorderConfig; // Will be union type when more types added
  /** Optional icon URL for display in inventory */
  iconUrl?: string;
  /** Whether this is a default cosmetic (always available) */
  isDefault?: boolean;
}

/**
 * User's equipped cosmetics by slot
 */
export interface EquippedCosmetics {
  /** Equipped avatar border cosmetic ID */
  avatarBorderId?: string;
  /** Equipped card border cosmetic ID (future) */
  cardBorderId?: string;
  /** Equipped card background cosmetic ID (future) */
  cardBackgroundId?: string;
  /** Equipped badge cosmetic IDs (future) */
  badgeIds?: string[];
}

/**
 * Resolved cosmetics for a user (full definitions)
 */
export interface ResolvedCosmetics {
  /** Resolved avatar border cosmetic */
  avatarBorder: CosmeticDefinition | null;
  /** Resolved card border cosmetic (future) */
  cardBorder: CosmeticDefinition | null;
  /** Resolved card background cosmetic (future) */
  cardBackground: CosmeticDefinition | null;
  /** Resolved badges (future) */
  badges: CosmeticDefinition[];
}
