/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — Supabase Realtime helpers
   RLS applies to every delivered payload: non-admin subscribers receive
   nothing, so these subscriptions are safe on the anon-key client.
   ════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { TABLES } from "./schema";

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

/* Coalates a burst of realtime events into ONE callback call (trailing
   debounce). Prevents refetch storms when bulk operations fire dozens of
   row events at once. `fire` is stable so an effect depending on it does
   not resubscribe channels on every render. */
function useDebouncedEvent(fn, debounceMs) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef(null);
  const delay = Number.isFinite(debounceMs) ? debounceMs : 0;

  const fire = useCallback(() => {
    if (delay <= 0) {
      fnRef.current();
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(), delay);
  }, [delay]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return fire;
}

/**
 * Reusable Realtime subscription hook — one channel per table, properly
 * cleaned up on unmount. INSERT / UPDATE / DELETE events are coalesced
 * (optionally debounced) and forwarded to the handler.
 *
 * Pages pass `() => table.load()` so the SERVER-side filtered / sorted /
 * paginated dataset is always reconciled to the incoming change. This
 * avoids the classic bug of blindly appending UPDATE events as new rows
 * or keeping stale filtered datasets.
 *
 * @param {string}   tableName     schema table to watch
 * @param {Function} onChange      receives the coalesced postgres_changes payload
 * @param {Object}   [options]
 * @param {boolean}  [options.enabled=true]
 * @param {number}   [options.debounceMs=250]   coalesce window
 * @param {string[]} [options.events=["INSERT","UPDATE","DELETE"]]
 */
export function useRealtimeTable(tableName, onChange, { enabled = true, debounceMs = 250, events = ["INSERT", "UPDATE", "DELETE"] } = {}) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;
  const eventsKey = (events || []).join(",");
  const okEvents = useRef(events);
  okEvents.current = events;

  const fire = useDebouncedEvent(() => cbRef.current?.({ eventType: "__COALESCED" }), debounceMs);

  useEffect(() => {
    if (!enabled || !tableName) return undefined;

    const channel = supabase
      .channel(`fhc-rt-${tableName}-${randomId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName }, (payload) => {
        if (okEvents.current.indexOf(payload.eventType) === -1) return;
        fire();
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`[FHC Realtime] subscription to "${tableName}" ${status}.`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, enabled, eventsKey, fire]);
}

/**
 * Subscribe to several tables with ONE shared coalescing refresh.
 * Used by the dashboard so any stat-affecting change refreshes the live
 * counters. One channel per table, all released on unmount.
 */
export function useRealtimeTableGroup(tables, onChange, { enabled = true, debounceMs = 400 } = {}) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;
  const tablesKey = (tables || []).join(",");
  const fire = useDebouncedEvent(() => cbRef.current?.({ eventType: "__COALESCED" }), debounceMs);

  useEffect(() => {
    if (!enabled || !tables || tables.length === 0) return undefined;

    const channels = tables.map((table) =>
      supabase
        .channel(`fhc-rt-${table}-${randomId()}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => fire())
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`[FHC Realtime] subscription to "${table}" ${status}.`);
          }
        })
    );

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [tablesKey, enabled, fire]);
}

/**
 * Named wrappers — semantic, single-source subscriptions.
 * Each binds the canonical table name from lib/schema.js so pages never
 * hardcode table names (a stale literal here would silently desync from
 * the migration). Signature + behaviour identical to useRealtimeTable.
 */
export function useRealtimeApplications(onChange, options) {
  return useRealtimeTable(TABLES.applications, onChange, options);
}

export function useRealtimeUsers(onChange, options) {
  return useRealtimeTable(TABLES.profiles, onChange, options);
}

export function useRealtimeProfiles(onChange, options) {
  return useRealtimeTable(TABLES.profiles, onChange, options);
}

export function useRealtimeTeamMembers(onChange, options) {
  return useRealtimeTable(TABLES.team, onChange, options);
}

/**
 * Watch a schema table for ANY row change.
 * @param {string} table
 * @param {(payload: object) => void} onAny
 * @returns {() => void} unsubscribe function
 */
export function watchTable(table, onAny) {
  const channel = supabase
    .channel(`fhc-${table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => onAny?.(payload))
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}