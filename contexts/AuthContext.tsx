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

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      const rawDob =
        (typeof metadata.dob === "string" && metadata.dob.trim()) ? metadata.dob.trim() :
        (typeof metadata.date_of_birth === "string" && metadata.date_of_birth.trim()) ? metadata.date_of_birth.trim() : "";
      const dobToWrite = rawDob || `${new Date().getFullYear()}-01-01`;
      const weight = Number(metadata.weight ?? 0);
      const height = Number(metadata.height ?? 0);
      const sleepingHours = Number(metadata.sleeping_hours ?? 0);

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name,
          dob: dobToWrite,
          weight: Number.isFinite(weight) ? weight : 0,
          height: Number.isFinite(height) ? height : 0,
          sleeping_hours: Number.isFinite(sleepingHours) ? sleepingHours : 0,
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
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
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
    async (
      name: string,
      dob: string,
      weight: number,
      height: number,
      sleepingHours: number,
      email: string,
      password: string,
    ) => {
      const normalizedEmail = email.trim().toLowerCase();
      const dobTrimmed = dob.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name.trim(),
            dob: dobTrimmed,
            weight,
            height,
            sleeping_hours: sleepingHours,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const { user } = authData;
      if (!user) {
        throw new Error("Signup succeeded but no user was returned.");
      }

      if (authData.session) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            name: name.trim(),
            dob: dobTrimmed,
            weight,
            height,
            sleeping_hours: sleepingHours,
          },
          { onConflict: "id" },
        );

        if (profileError) {
          throw new Error(profileError.message);
        }
      } else {
        throw new Error(
          "Signup successful. Please confirm your email, then log in.",
        );
      }
    },
    [],
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
    login,
    loginWithGoogle,
    sendPasswordReset,
    signup,
    logout,
  };
});
