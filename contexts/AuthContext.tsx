import { clearUserCache } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  name: string;
  dob: string;
  weight: number;
  height: number;
  sleepingHours: number;
  email: string;
  createdAt: string;
};

/** Compute age in years from ISO date string (e.g. "1990-01-15"). Use when UI needs to display age. */
export function getAgeFromDob(dob: string | null | undefined): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

/** Check whether a profile has been completed (has real DOB, weight, height). */
function isProfileComplete(profile: AuthUser | null): boolean {
  if (!profile) return false;
  // Profile is complete when DOB is set to something other than fallback,
  // and weight & height are non-zero.
  const hasDob =
    !!profile.dob &&
    profile.dob !== "" &&
    !profile.dob.endsWith("-01-01");
  const hasWeight = profile.weight > 0;
  const hasHeight = profile.height > 0;
  return hasDob && hasWeight && hasHeight;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const ensureProfile = useCallback(
    async (user: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }) => {
      const metadata = user.user_metadata ?? {};
      const name =
        typeof metadata.name === "string" && metadata.name.trim().length > 0
          ? metadata.name.trim()
          : "User";

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name,
          dob: `${new Date().getFullYear()}-01-01`,
          weight: 0,
          height: 0,
          sleeping_hours: 0,
        },
        { onConflict: "id" },
      );

      if (error) {
        throw new Error(error.message);
      }
    },
    [],
  );

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, dob, weight, height, sleeping_hours, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      dob: data.dob ?? "",
      weight: data.weight,
      height: data.height,
      sleepingHours: data.sleeping_hours,
      email: email ?? "",
      createdAt: data.created_at,
    } as AuthUser;
  }, []);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw new Error(error.message);
        }

        if (session?.user) {
          let profile = await fetchProfile(
            session.user.id,
            session.user.email ?? undefined,
          );

          if (!profile) {
            await ensureProfile(session.user);
            profile = await fetchProfile(
              session.user.id,
              session.user.email ?? undefined,
            );
          }

          setCurrentUser(profile);
          setIsAuthenticated(true);
          setProfileComplete(isProfileComplete(profile));
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setProfileComplete(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setProfileComplete(false);
          setIsLoading(false);
          return;
        }

        let profile = await fetchProfile(
          session.user.id,
          session.user.email ?? undefined,
        );

        if (!profile) {
          await ensureProfile(session.user);
          profile = await fetchProfile(
            session.user.id,
            session.user.email ?? undefined,
          );
        }

        setCurrentUser(profile);
        setIsAuthenticated(true);
        setProfileComplete(isProfileComplete(profile));
        setIsLoading(false);
      },
    );

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [ensureProfile, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
    );
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const { user } = authData;
      if (!user) {
        throw new Error("Signup succeeded but no user was returned.");
      }

      // Supabase returns an empty identities array when the email is already taken
      // (with email confirmation enabled, it doesn't return an error for security)
      if (!user.identities || user.identities.length === 0) {
        throw new Error(
          "An account with this email already exists. Please login instead.",
        );
      }

      // If Supabase has email confirmation enabled, there won't be a session.
      // Since we've already verified the email via our own OTP, auto-login.
      if (!authData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          // If login fails (e.g., Supabase email confirmation blocks it),
          // throw a descriptive error
          throw new Error(
            "Account created but auto-login failed: " + signInError.message,
          );
        }
      }

      // Now we should have an active session — create a minimal profile
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name: "User",
          dob: `${new Date().getFullYear()}-01-01`,
          weight: 0,
          height: 0,
          sleeping_hours: 0,
        },
        { onConflict: "id" },
      );

      if (profileError) {
        throw new Error(profileError.message);
      }
    },
    [],
  );

  const updateProfile = useCallback(
    async (data: {
      name?: string;
      dob?: string;
      weight?: number;
      height?: number;
      sleepingHours?: number;
    }) => {
      if (!currentUser) {
        throw new Error("No authenticated user.");
      }

      const updatePayload: Record<string, unknown> = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.dob !== undefined) updatePayload.dob = data.dob;
      if (data.weight !== undefined) updatePayload.weight = data.weight;
      if (data.height !== undefined) updatePayload.height = data.height;
      if (data.sleepingHours !== undefined)
        updatePayload.sleeping_hours = data.sleepingHours;

      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", currentUser.id);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh profile
      const updated = await fetchProfile(currentUser.id, currentUser.email);
      if (updated) {
        setCurrentUser(updated);
        setProfileComplete(isProfileComplete(updated));
      }
    },
    [currentUser, fetchProfile],
  );

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    await clearUserCache();
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    profileComplete,
    login,
    loginWithGoogle,
    sendPasswordReset,
    signup,
    updateProfile,
    logout,
  };
});
