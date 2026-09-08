import { motion } from "framer-motion";
import { formatTeamName } from "../../lib/teamMembers";
import { Led } from "./bits";
import PlayerCard from "./PlayerCard";

export default function TeamSection({ group, globalStart, onOpen }) {
  const sectorNum = String(group.num ?? 0).padStart(2, "0");
  const seat = String(group.key).padEnd(8, "\u00a0");

  return (
    <section className="relative z-10 arena-team-section">
      {/* Sector switch scan sweep — replays each time a sector activates */}
      <span className="arena-switch-scan" aria-hidden="true" />

      {/* Section header */}
      <div className="mb-6">
        <motion.div
          className="flex flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <span className="arena-sector-num font-pixel text-[18px] sm:text-[22px] text-[#FF1687]/25">
              {sectorNum}
            </span>
            <div>
              <h2 className="font-pixel text-[11px] sm:text-[13px] text-[#FFF7E5] tracking-[0.16em]">
                {formatTeamName(group.key)}
              </h2>
              <p className="font-pixel text-[6px] tracking-[0.22em] text-[#1ED7E8]/45 mt-1.5">
                SECTOR_{sectorNum} // {seat.trim()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="arena-seat-count inline-flex items-center gap-2 px-3 py-1.5 font-pixel text-[7px] tracking-[0.16em] text-[#36D65A]/75 bg-[#07100a]/50 border border-[#36D65A]/20">
              <Led color="#36D65A" size={5} />
              {String(group.members.length).padStart(2, "0")} ACTIVE PLAYERS
            </span>
          </div>
        </motion.div>

        <div className="arena-sep mt-4">
          <span className="arena-sep-line" />
          <span className="arena-sep-dot" />
          <span className="arena-sep-line" />
          <span className="arena-sep-pipe font-pixel text-[6px] text-[#FFF7E5]/20 tracking-[0.2em]">
            FHC_NETWORK
          </span>
          <span className="arena-sep-line" />
        </div>
      </div>

      {/* Player grid */}
      <div className="arena-grid">
        {group.members.map((member, i) => (
          <PlayerCard
            key={member.id || `${member.name}-${i}`}
            member={member}
            index={globalStart + i}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}
