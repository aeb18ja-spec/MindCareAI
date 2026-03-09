import AsyncStorage from "@react-native-async-storage/async-storage";

/** Keys used for user-specific cache; clear these on logout. */
export const CACHE_KEYS = {
  MOODS_CACHE: "@mindcare_moods_cache",
  JOURNAL_CACHE: "@mindcare_journal_cache",
} as const;

/**
 * Clears user-specific cached data from AsyncStorage (e.g. on logout).
 * Does not clear theme or other UI-only preferences.
 */
export async function clearUserCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([CACHE_KEYS.MOODS_CACHE, CACHE_KEYS.JOURNAL_CACHE]);
  } catch {
    // Ignore clear errors
  }
}
