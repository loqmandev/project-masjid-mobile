/**
 * Utility functions for the Jejak Masjid app
 */

const MAX_NAME_LENGTH = 20;

/**
 * Gets the display name for a user, with fallback logic for empty names.
 *
 * Priority order:
 * 1. The provided user.name (from OAuth)
 * 2. A generated name from email prefix (e.g., "ahmad123" from "ahmad@gmail.com")
 * 3. A random guest name (e.g., "Guest1234")
 *
 * @param userName - The user's name from OAuth (can be null/undefined/empty)
 * @param email - The user's email address (for generating a fallback name)
 * @returns A display name between 2-20 characters
 */
export function getDisplayName(
  userName: string | null | undefined,
  email?: string | null
): string {
  if (userName?.trim()) {
    const trimmed = userName.trim();
    return trimmed.length > MAX_NAME_LENGTH
      ? trimmed.substring(0, MAX_NAME_LENGTH)
      : trimmed;
  }

  // Generate placeholder from email
  if (email) {
    const prefix = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    if (prefix.length >= 2) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const combined = prefix + randomSuffix;
      return combined.length > MAX_NAME_LENGTH
        ? combined.substring(0, MAX_NAME_LENGTH)
        : combined;
    }
  }

  // Final fallback - generate a random guest name
  return 'Guest' + Math.floor(1000 + Math.random() * 9000);
}
