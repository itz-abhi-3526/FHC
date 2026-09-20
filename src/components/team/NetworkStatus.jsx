import { motion } from "framer-motion";
import { TEAM_STATE } from "../../lib/teamMembers";
import { Led, Brackets, ScanOverlay } from "./bits";

export default function NetworkStatus({ state, teams, total }) {
  const live = state === TEAM_STATE.SUCCESS;

  return (
    <section className="relative z-10 -mt-1 hidden md:block px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1400px] mx-auto">
        <motion.div
          className="arena-net relative border border-[#00E5FF]/18 bg-[#04070d]"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Brackets size={10} color="#1ED7E8" />
          <ScanOverlay />
          <div className="arena-net-inner relative z-[3] px-5 py-4 flex flex-wrap items-center justify-center sm:justify-between gap-x-8 gap-y-3">
            <span className="arena-net-item">
              <span className="arena-net-dot" style={{ background: "#FF1687" }} />
              <span className="arena-net-label">NETWORK</span>
              <span className="arena-net-state text-[#36D65A]">ONLINE</span>
            </span>

            <span className="arena-net-item">
              <span className="arena-net-dot" style={{ background: live ? "#36D65A" : "#FFD21A" }} />
              <span className="arena-net-label">PLAYER DATABASE</span>
              <span className="arena-net-state" style={{ color: live ? "#36D65A" : state === TEAM_STATE.ERROR ? "#FF1687" : "#FFD21A" }}>
                {live ? "CONNECTED" : state === TEAM_STATE.ERROR ? "OFFLINE" : "SYNCING"}
              </span>
            </span>

            <span className="arena-net-item">
              <span className="arena-net-dot" style={{ background: live ? "#1ED7E8" : "#3a3a42" }} />
              <span className="arena-net-label">ACTIVE OPERATORS</span>
              <span className="arena-net-state text-[#1ED7E8]">
                {live ? total : "--"}
              </span>
            </span>

            <span className="arena-net-item">
              <span className="arena-net-dot" style={{ background: live ? "#1ED7E8" : "#3a3a42" }} />
              <span className="arena-net-label">SECTORS ONLINE</span>
              <span className="arena-net-state text-[#1ED7E8]">
                {live && Array.isArray(teams) ? teams.length : "--"}
              </span>
            </span>

            <span className="arena-net-item">
              <span className="arena-net-dot" style={{ background: "#FFD21A" }} />
              <span className="arena-net-label">FHC NODE</span>
              <span className="arena-net-state text-[#FFD21A]">01</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
