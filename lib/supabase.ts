import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

const isBrowser = typeof window !== "undefined";
const isWeb = Platform.OS === "web";

const webStorage = {
  getItem: async (key: string) => window.localStorage.getItem(key),
  setItem: async (key: string, value: string) => {
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    window.localStorage.removeItem(key);
  },
};

const authStorage = isWeb ? (isBrowser ? webStorage : undefined) : AsyncStorage;

/**
 * No-op lock to avoid "The lock request is aborted" in React Native and
 * when Navigator Lock API is unavailable or aborts (e.g. tab backgrounded).
 * Supabase defaults to navigator.locks in browser, which can cause this error.
 */
const noOpLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    // Keep sessions across reloads on both web and native
    autoRefreshToken: true,
    persistSession: true,
    // For OAuth (e.g. Google) on web, Supabase needs to read the session
    // from the URL fragment after redirect. On native, this should stay false.
    detectSessionInUrl: isWeb,
    lock: noOpLock,
  },
});
