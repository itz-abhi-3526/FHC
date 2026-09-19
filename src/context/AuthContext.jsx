import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

/**
 * Standalone helper: checks Supabase Auth user metadata for admin role.
 * The administrator role is an AUTHORIZATION claim, not user-editable
 * profile data — so app_metadata is the trusted source (written only by
 * the secure server-side admin_set_user_role() / admin_bootstrap() RPCs).
 * user_metadata is user-writable and is NEVER treated as authoritative;
 * it is consulted only as a mirror for already-trusting legacy flows.
 */
export function isAdmin(user) {
  if (!user) return false;
  if (user?.app_metadata?.role === "admin") return true;
  if (user?.user_metadata?.role === "admin") return true;
  return false;
}

export function isMedia(user) {
  if (!user) return false;
  if (user?.app_metadata?.role === "media") return true;
  if (user?.user_metadata?.role === "media") return true;
  return false;
}

export function canManageGallery(user) {
  return isAdmin(user) || isMedia(user);
}

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

    /* No profile row yet (e.g. created before this schema, or the signup
       trigger missed). RLS lets the user INSERT their own row, so repair
       it in place — never touches any other user's data. */
    console.warn("[FHC] No profile found for uid — self-healing create:", uid);
    const { data: userAuth } = await supabase.auth.getUser();
    const metaName = userAuth?.user?.user_metadata?.full_name || "";
    /* Only write columns that exist in the LIVE profiles schema
       (id, full_name, avatar_url) — never avatar_seed/email etc. */
    const created = {
      id: uid,
      full_name: metaName,
      avatar_url: null,
    };
    const { error: insErr } = await supabase.from("profiles").insert(created);
    if (insErr) {
      console.warn("[FHC] Profile self-heal create failed:", insErr.message);
      return null;
    }
    setProfile(created);
    return created;
  }, []);

  useEffect(() => {
    let mounted = true;

    /* Listen for auth changes BEFORE resolving the boot session so no
       event (INITIAL_SESSION / SIGNED_OUT / TOKEN_REFRESHED...) is lost
       in the gap between the two reads. */
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("[FHC] Auth state:", event, s ? "session active" : "no session");
      setSession(s);
      setUser(s?.user ?? null);
      setStatus(s ? AUTH_STATUS.AUTHED : AUTH_STATUS.ANON);
      setProfile(null);
      if (s) fetchProfile(s.user.id);
    });

    /* Boot: validate the persisted session against the AUTH SERVER before
       declaring AUTHED. getUser() forces a real token check and returns an
       error for stale/invalid tokens — so a session that can no longer
       refresh (e.g. rotated after a key change) drops straight to ANON
       instead of going AUTHED → SIGNED_OUT a frame later. This is the fix
       for the INITIAL_SESSION / SIGNED_OUT phantom. */
    (async () => {
      try {
        const { data: uData, error: uErr } = await supabase.auth.getUser();
        if (!mounted) return;
        if (uErr || !uData?.user) {
          setSession(null);
          setUser(null);
          setStatus(AUTH_STATUS.ANON);
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const s = data.session;
        setSession(s);
        setUser(s?.user ?? uData.user);
        setStatus(s ? AUTH_STATUS.AUTHED : AUTH_STATUS.ANON);
        if (s) fetchProfile(s.user.id);
      } catch (err) {
        console.warn("[FHC] Boot session validation error:", err.message);
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setStatus(AUTH_STATUS.ANON);
      }
    })();

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

  /**
   * refreshRole — force a session refresh then re-fetch the profile so a
   * role change made by an admin (auth.users metadata) is picked up by
   * the target user immediately instead of waiting for natural token
   * expiry/refresh.
   */
  const refreshRole = useCallback(
    async (uid) => {
      const targetId = uid || user?.id;
      if (!targetId) return null;
      try {
        await supabase.auth.refreshSession();
      } catch (err) {
        console.warn("[FHC] refreshRole session refresh failed:", err?.message);
      }
      return fetchProfile(targetId);
    },
    [user, fetchProfile, supabase]
  );

  /* Secure role resolution (trusted most → least):
     - Authoritative: user.app_metadata.role
           Supabase Auth app_metadata (raw_app_meta_data) is the ONLY
           source the database trusts (is_fhc_admin reads raw_app_meta_data
           first). Only admin_set_user_role() / admin_bootstrap() can write
           it — a normal user CANNOT self-promote through the frontend.
     - Mirror:        user.user_metadata.role  (kept in sync by the same RPCs,
           just a legacy-friendly copy; user-writable, never authoritative).
     - UI mirror:     profiles.role (read-only display mirror, RLS-synced).
     - Final:         "user".
     The real authorization boundary is the database: RLS + the secure
     SECURITY DEFINER RPCs re-check is_fhc_admin() on every gate. */
  const role =
    user?.app_metadata?.role ||
    user?.user_metadata?.role ||
    profile?.role ||
    "user";

  const value = useMemo(
    () => ({
      status,
      session,
      user,
      profile,
      role,
      isAdmin: role === "admin",
      isMedia: role === "media",
      canManageGallery: role === "admin" || role === "media",
      refreshProfile,
      refreshRole,
      signOut: () => supabase.auth.signOut(),
      supabase,
    }),
    [status, session, user, profile, role, refreshProfile, refreshRole, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}