import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TEAM_STATE, teamShortLabel } from "../../lib/teamMembers";
import { Led, Brackets, ScanOverlay } from "./bits";

const EASE = [0.22, 1, 0.36, 1];

function SystemClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-[#1ED7E8]/55">{now.toTimeString().slice(0, 8)}</span>;
}

function rosterState(state) {
  if (state === TEAM_STATE.LOADING)
    return { label: "SCANNING SECTORS...", tone: "#FFD21A" };
  if (state === TEAM_STATE.ERROR)
    return { label: "REGISTRY OFFLINE", tone: "#FF1687" };
  return { label: "REGISTRY ONLINE", tone: "#36D65A" };
}

export default function TeamHero({ state, teams, total }) {
  const status = rosterState(state);
  const loaded = state === TEAM_STATE.SUCCESS;

  return (
    <section className="relative overflow-hidden arena-hero fhc-hero-pad">
      <div className="arena-hero-grid" aria-hidden="true" />
      <ScanOverlay className="opacity-50" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* System header strip */}
        <motion.div
          className="flex items-center justify-between gap-3 font-pixel text-[7px] sm:text-[8px] tracking-[0.2em] text-[#FFF7E5]/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <span className="flex items-center gap-2">
            <Led color="#FF1687" size={5} />
            FHC // PLAYER REGISTRY
          </span>
          <span className="hidden sm:flex items-center gap-2">
            <Led color="#1ED7E8" size={5} />
            <span className="text-[#1ED7E8]/45">NODE_01</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="hidden md:inline text-[#FFF7E5]/30">LOCAL</span>
            <SystemClock />
          </span>
        </motion.div>

        {/* Main hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 md:gap-10 lg:gap-16 items-center mt-6 md:mt-10 lg:mt-12 md:pb-1">
          {/* Left: Identity */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <p className="font-pixel text-[8px] sm:text-[9px] text-[#FF1687]/75 tracking-[0.28em] mb-5">
                /// FHC NETWORK - PLAYER DIRECTORY
              </p>

              <h1 className="font-pixel leading-[1.05]">
                <span
                  className="block text-[#FFF7E5] text-[clamp(32px,6.5vw,80px)]"
                  style={{ textShadow: "4px 4px 0 rgba(255,22,135,0.15), 6px 6px 0 rgba(8,9,11,0.9)" }}
                >
                  PLAYERS
                </span>
                <span
                  className="block text-[#1ED7E8] text-[clamp(32px,6.5vw,80px)] mt-1"
                  style={{ textShadow: "0 0 40px rgba(30,215,232,0.25), 4px 4px 0 rgba(8,9,11,0.9)" }}
                >
                  ARENA
                  <span className="arena-cursor" aria-hidden="true">_</span>
                </span>
              </h1>

              <div className="h-px w-full max-w-[440px] my-5 md:my-7 bg-gradient-to-r from-[#FF1687]/50 via-[#FF1687]/12 to-transparent" />

              <p className="text-base sm:text-lg md:text-2xl text-[#FFF7E5]/70 font-mono leading-relaxed max-w-[540px]">
                MEET THE OPERATORS OF THE FHC NETWORK.
                <br />
                <span className="text-[#FFF7E5]/40">
                  OPEN A PLAYER DOSSIER FOR FULL IDENTITY DATA._
                </span>
              </p>
            </motion.div>

            {/* Telemetry chips */}
            <motion.div
              className="mt-5 sm:mt-6 md:mt-8 flex flex-wrap items-center gap-2 md:gap-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            >
              <span className="arena-chip">
                <span className="arena-chip-key">ACTIVE OPERATORS</span>
                <span className="arena-chip-val">{loaded ? total : "--"}</span>
              </span>
              <span className="arena-chip">
                <span className="arena-chip-key">SECTORS ONLINE</span>
                <span className="arena-chip-val">{loaded && Array.isArray(teams) ? teams.length : "--"}</span>
              </span>
              <span className="arena-chip">
                <span className="arena-chip-key">STATUS</span>
                <span className="arena-chip-val" style={{ color: status.tone }}>{status.label}</span>
              </span>
            </motion.div>
          </div>

          {/* Right: Roster terminal */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          >
            <div className="arena-roster relative bg-[#03050B] border border-[#1ED7E8]/22">
              <Brackets size={12} color="#FF1687" />
              <ScanOverlay />
              <div className="arena-roster-head flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-[#00E5FF]/12">
                <span className="font-pixel text-[7px] tracking-[0.2em] text-[#1ED7E8]/75">
                  FHC_PLAYER_ROSTER
                </span>
                <span className="font-pixel text-[6px] text-[#FFF7E5]/25">v2.0</span>
              </div>

              <div className="px-3 py-2.5 sm:px-4 sm:py-4 font-mono text-base sm:text-lg leading-[1.65] sm:leading-[1.9]">
                {/* Terminal scan log — desktop/tablet only. On phones the
                    roster frame collapses to a compact status panel:
                    header + connection row (stats live in the chips +
                    network bar), so the hero stays a slim arcade header. */}
                <div className="hidden md:block">
                  <p className="text-[#36D65A]/65 mb-3">
                    $ fhc roster --scan<span className="arena-cursor">|</span>
                  </p>
                  {state === TEAM_STATE.LOADING && (
                    <p className="text-[#FFD21A] animate-pulse">
                      &gt; SYNCING SECTORS...
                    </p>
                  )}
                  {state === TEAM_STATE.ERROR && (
                    <p className="text-[#FF1687]">&gt; CONNECTION LOST. RETRY REQUIRED.</p>
                  )}
                  {state === TEAM_STATE.SUCCESS && Array.isArray(teams) && teams.length === 0 && (
                    <p className="text-[#FFD21A]">&gt; NO ACTIVE PLAYERS DETECTED.</p>
                  )}
                  {state === TEAM_STATE.SUCCESS &&
                    Array.isArray(teams) &&
                    teams.length > 0 &&
                    teams.map((g) => (
                      <div key={g.key} className="arena-roster-row flex items-center gap-2 sm:gap-3 text-[#FFF7E5]/70">
                        <span className="text-[#FF1687]/70">&raquo;</span>
                        <span className="tracking-[0.14em]">{teamShortLabel(g.key).padEnd(10, "\u00a0")}</span>
                        <span className="flex-1 border-b border-dotted border-[#00E5FF]/18 translate-y-[-3px]" />
                        <span className="text-[#1ED7E8]">
                          {String(Array.isArray(g.members) ? g.members.length : 0).padStart(2, "0")}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="mt-3 sm:mt-4 pt-3 border-t border-[#00E5FF]/12 flex items-center justify-between">
                  <span className="font-pixel text-[6px] tracking-[0.18em] text-[#FFF7E5]/35">
                    CONNECTION:
                  </span>
                  <span
                    className="font-pixel text-[6px] tracking-[0.18em] flex items-center gap-2"
                    style={{ color: status.tone }}
                  >
                    <Led color={status.tone} size={5} />
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            <p className="hidden sm:block mt-3 text-center font-pixel text-[6px] tracking-[0.3em] text-[#1ED7E8]/30">
              MODULE 01 // ROSTER
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
