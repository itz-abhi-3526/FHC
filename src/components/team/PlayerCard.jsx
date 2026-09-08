import { motion } from "framer-motion";
import { formatTeamName } from "../../lib/teamMembers";
import { Led, Brackets } from "./bits";
import PlayerPhoto from "./PlayerPhoto";

export default function PlayerCard({ member, index, onOpen }) {
  const num = index + 1;
  const pid = `PLAYER_${String(num).padStart(2, "0")}`;

  return (
    <motion.article
      className="arena-card group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.55, delay: (index % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        className="arena-card-btn"
        onClick={() => onOpen(member, num)}
        aria-label={`Open player dossier for ${member.name}`}
      >
        <Brackets size={11} color="#FF1687" />

        {/* Header strip */}
        <div className="arena-card-head">
          <span className="arena-card-pid font-pixel text-[7px] tracking-[0.18em]">
            {pid}
          </span>
          <span className="arena-card-status font-pixel text-[6px] tracking-[0.16em]">
            <Led color="#36D65A" size={5} className="mr-1.5" />
            ACTIVE
          </span>
        </div>

        {/* Photograph */}
        <div className="arena-card-photo-wrap overflow-hidden">
          <PlayerPhoto
            member={member}
            alt={`${member.name} -- ${member.designation || "FHC player"}`}
          />
        </div>

        {/* Identity */}
        <div className="arena-card-body">
          <h3 className="arena-card-name font-pixel text-[11px] text-[#FFF7E5]">
            {member.name}
          </h3>
          <p className="arena-card-role font-pixel text-[8px] text-[#FF1687]/75 mt-1.5">
            {member.designation || "OPERATOR"}
          </p>
          <div className="arena-card-divide" aria-hidden="true" />

          <div className="flex items-center justify-between">
            <span className="arena-card-team font-pixel text-[7px] text-[#1ED7E8]/65">
              {formatTeamName(member.team)}
            </span>
            <span className="arena-card-node font-pixel text-[6px] text-[#FFF7E5]/25">
              FHC // NODE_01
            </span>
          </div>

          <div className="arena-card-open mt-3 flex items-center gap-2 font-pixel text-[7px] tracking-[0.18em] text-[#1ED7E8]/0">
            <span>ACCESS DOSSIER</span>
            <span aria-hidden="true">-&gt;</span>
          </div>
        </div>
      </button>
    </motion.article>
  );
}
