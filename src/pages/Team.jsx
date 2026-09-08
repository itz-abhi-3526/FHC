import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MotionConfig, AnimatePresence, motion } from "framer-motion";
import Footer from "../components/Footer";
import ArenaBackground from "../components/team/ArenaBackground";
import TeamHero from "../components/team/TeamHero";
import NetworkStatus from "../components/team/NetworkStatus";
import TeamSelector from "../components/team/TeamSelector";
import TeamSection from "../components/team/TeamSection";
import PlayerDossier from "../components/team/PlayerDossier";
import LoadingArena from "../components/team/LoadingArena";
import ErrorArena from "../components/team/ErrorArena";
import EmptyArena from "../components/team/EmptyArena";
import { useTeamMembers } from "../hooks/useTeamMembers";
import { buildArena, TEAM_STATE } from "../lib/teamMembers";

export default function Team() {
  const { state, members, retry } = useTeamMembers();
  const [filter, setFilter] = useState(null);
  const [dossier, setDossier] = useState(null);

  const arena = useMemo(() => buildArena(members), [members]);
  /* teams MUST carry the full group objects (including members[]) so that
     TeamHero can safely read g.members.length in the roster terminal. */
  const teams = arena;
  const total = members.length;

  const activeKey = filter ?? teams[0]?.key ?? null;
  const activeTeam = useMemo(() => {
    if (!activeKey) return null;
    return teams.find((g) => g.key === activeKey) ?? teams[0] ?? null;
  }, [teams, activeKey]);

  const groupStart = useMemo(() => {
    const map = new Map();
    let cursor = 0;
    for (const g of arena) {
      map.set(g.key, cursor);
      cursor += g.members.length;
    }
    return map;
  }, [arena]);

  const openDossier = useCallback((member, pid) => {
    setDossier({ member, pid });
  }, []);

  const closeDossier = useCallback(() => setDossier(null), []);

  return (
    <MotionConfig reducedMotion="user">
      <main className="arena-page relative overflow-x-clip">
        <ArenaBackground />
        <TeamHero state={state} teams={teams} total={total} />
        <NetworkStatus state={state} teams={teams} total={total} />

        {state === TEAM_STATE.SUCCESS && teams.length > 0 && (
          <TeamSelector teams={teams} active={activeKey} onSelect={setFilter} />
        )}

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-6">
          {state === TEAM_STATE.LOADING && <LoadingArena />}
          {state === TEAM_STATE.ERROR && <ErrorArena onRetry={retry} />}
          {state === TEAM_STATE.SUCCESS && teams.length === 0 && (
            <EmptyArena onRefresh={retry} />
          )}

          {state === TEAM_STATE.SUCCESS && activeTeam && (
            <AnimatePresence mode="wait">
              <motion.section
                key={activeTeam.key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <TeamSection
                  group={activeTeam}
                  globalStart={groupStart.get(activeTeam.key) ?? 0}
                  onOpen={openDossier}
                />
              </motion.section>
            </AnimatePresence>
          )}

          {/* CTA */}
          {state === TEAM_STATE.SUCCESS && teams.length > 0 && (
            <div className="arena-cta mt-20 border border-[#FF1687]/25 bg-[#0a060a] relative overflow-hidden">
              <div className="arena-cta-glows" aria-hidden="true" />
              <div className="relative z-[2] px-6 py-10 flex flex-col items-center text-center">
                <p className="font-pixel text-[8px] text-[#1ED7E8]/65 tracking-[0.2em] mb-3">
                  EVERY SECTOR HAS A SEAT.
                </p>
                <p className="font-pixel text-[13px] sm:text-[17px] text-[#FFF7E5] tracking-[0.12em]">
                  WANT TO ENTER THE ARENA?
                </p>
                <p className="mt-3 text-lg text-[#FFF7E5]/45 font-mono max-w-[420px]">
                  Join FHC and operate a sector of the network with us.
                </p>
                <Link
                  to="/join"
                  className="mt-7 inline-flex items-center gap-3 border-[3px] border-[#FF1687] px-6 py-3.5 font-pixel text-[10px] tracking-[0.14em] text-[#FFF7E5] hover:bg-[#FF1687] hover:text-[#0a060a] transition-all"
                >
                  {">"} JOIN THE NETWORK
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16" />

        <PlayerDossier
          player={dossier?.member || null}
          pid={dossier?.pid || ""}
          onClose={closeDossier}
        />

        <Footer />
      </main>
    </MotionConfig>
  );
}