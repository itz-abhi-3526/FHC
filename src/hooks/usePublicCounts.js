import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/* ════════════════════════════════════════════════════════════════════
   FHC // public live counts
   Single anon-RLS query for the marketing pages (Home / About). Every
   number rendered is a REAL head-count against LIVE tables:
     users   -> profiles                       (registered users)
     members -> profiles WHERE role = 'member' (active club members)
     gallery -> gallery_folders                (media archive albums)
     team    -> team_members WHERE is_active    (active team members)
   Until the rows arrive, values stay null so pages can render a neutral
   placeholder instead of a fabricated count.
   ════════════════════════════════════════════════════════════════════ */

export const PUBLIC_COUNTS_EMPTY = { users: null, members: null, gallery: null, team: null };

export function usePublicCounts() {
  const [counts, setCounts] = useState(PUBLIC_COUNTS_EMPTY);

  useEffect(() => {
    let active = true;

    const countRows = async (table, column, value) => {
      try {
        let q = supabase.from(table).select("id", { count: "exact", head: true });
        if (value !== undefined) q = q.eq(column, value);
        const { count, error } = await q;
        return error ? null : count || 0;
      } catch {
        return null;
      }
    };

    (async () => {
      const [users, members, gallery, team] = await Promise.all([
        countRows("profiles"),
        countRows("profiles", "role", "member"),
        countRows("gallery_folders"),
        countRows("team_members", "is_active", true),
      ]);
      if (active) setCounts({ users, members, gallery, team });
    })();

    return () => {
      active = false;
    };
  }, []);

  return counts;
}