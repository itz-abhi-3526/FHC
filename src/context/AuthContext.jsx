import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AUTH_STATUS = {
  LOADING: "loading",
  AUTHED: "authed",
  ANON: "anon",
};

/**
 * Global FHC authentication state.
 *
 * status:  "loading" | "authed" | "anon"
 * session: current Supabase session (or null)
 * user:    Supabase Auth user (or null)
 * profile: profiles table row for the user (or null)
 */
export function AuthProvider({ children }) {
  const [status, setStatus] = useState(AUTH_STATUS.LOADING);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async (uid) => {
    if (!uid) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      console.warn("[FHC] Profile fetch error:", error.message, "(uid:", uid, ")");
      return null;
    }
    if (data) {
      setProfile(data);
      return data;
    }
    console.warn("[FHC] No profile found for uid:", uid);
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn("[FHC] getSession error:", error.message);
      }
      const s = data.session;
      setSession(s);
      setUser(s?.user ?? null);
      setStatus(s ? AUTH_STATUS.AUTHED : AUTH_STATUS.ANON);
      if (s) fetchProfile(s.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("[FHC] Auth state:", event, s ? "session active" : "no session");
      setSession(s);
      setUser(s?.user ?? null);
      setStatus(s ? AUTH_STATUS.AUTHED : AUTH_STATUS.ANON);
      setProfile(null);
      if (s) fetchProfile(s.user.id);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * refreshProfile — fetches the current user's profile.
   * Pass a uid explicitly (e.g. right after login/signup) to avoid
   * depending on the React `user` state which may lag behind the
   * actual Supabase session.
   */
  const refreshProfile = useCallback(
    (uid) => {
      const target = uid || user?.id;
      if (!target) return Promise.resolve(null);
      return fetchProfile(target);
    },
    [user, fetchProfile]
  );

  const value = useMemo(
    () => ({
      status,
      session,
      user,
      profile,
      refreshProfile,
      signOut: () => supabase.auth.signOut(),
      supabase,
    }),
    [status, session, user, profile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}