import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════════
   FHC // ADMIN — data hooks
   useAdminData: server-side paginated/searchable/filterable data.
   useSelection: row multi-select for bulk actions.
   ════════════════════════════════════════════════════════════════════ */

export function useAdminData(fetcher, { deps = [], pageSize = 20, initialFilters = {} } = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || "created_at");
  const [sortDir, setSortDir] = useState(initialFilters.sortDir || "desc");
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const { data: rows, count: total, error } = await fetcher({
        ...filters,
        page,
        pageSize: pageSizeState,
        sortBy,
        sortDir,
      });
      if (mySeq !== seq.current) return; // stale response
      if (error) {
        setError(error);
        setData([]);
        setCount(0);
      } else {
        setData(rows || []);
        setCount(total || 0);
      }
    } catch (err) {
      if (mySeq !== seq.current) return;
      setError(err);
      setData([]);
      setCount(0);
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, [fetcher, filters, page, pageSizeState, sortBy, sortDir]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, pageSizeState, sortBy, sortDir, ...deps]);

  const updateFilters = useCallback((patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSortBy(initialFilters.sortBy || "created_at");
    setSortDir(initialFilters.sortDir || "desc");
    setPage(1);
  }, [initialFilters]);

  const sort = useCallback(
    (key) => {
      if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortBy(key);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortBy]
  );

  const pages = Math.max(1, Math.ceil(count / pageSizeState));
  const from = count === 0 ? 0 : (page - 1) * pageSizeState + 1;
  const to = Math.min(count, page * pageSizeState);

  return {
    data,
    count,
    page,
    pages,
    from,
    to,
    pageSize: pageSizeState,
    sortBy,
    sortDir,
    loading,
    error,
    filters,
    load,
    setPage,
    setPageSize: (n) => {
      setPageSizeState(n);
      setPage(1);
    },
    updateFilters,
    clearFilters,
    sort,
    retry: load,
  };
}

export function useSelection(rows = [], keyFn = (r) => r.id) {
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set();
      for (const s of prev) {
        if (rows.some((r) => keyFn(r) === s)) next.add(s);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const toggle = useCallback(
    (id) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    []
  );

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const all = new Set(rows.map(keyFn));
      const shouldSelect = rows.length > 0 && rows.some((r) => !prev.has(keyFn(r)));
      return shouldSelect ? all : new Set();
    });
  }, [rows, keyFn]);

  const clear = useCallback(() => setSelected(new Set()), []);
  const isEmpty = selected.size === 0;

  return { selected, toggle, toggleAll, clear, isEmpty };
}

export function useDebouncedValue(value, delay = 320) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* Map a set of ids → row objects for the current page */
export function selectedRows(rows, selected, keyFn = (r) => r.id) {
  return rows.filter((r) => selected.has(keyFn(r)));
}

export function useMemoKey(obj) {
  return useMemo(() => JSON.stringify(obj), [obj]);
}