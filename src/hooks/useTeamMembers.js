import { useCallback, useEffect, useRef, useState } from "react";
import { fetchActiveTeamMembers, TEAM_STATE } from "../lib/teamMembers";

export function useTeamMembers() {
  const [state, setState] = useState(TEAM_STATE.LOADING);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setState(TEAM_STATE.LOADING);
    setError(null);
    try {
      const rows = await fetchActiveTeamMembers();
      if (!mounted.current) return;
      setMembers(rows);
      setState(TEAM_STATE.SUCCESS);
    } catch (err) {
      if (!mounted.current) return;
      setMembers([]);
      setError(err);
      setState(TEAM_STATE.ERROR);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { state, members, error, retry: load };
}