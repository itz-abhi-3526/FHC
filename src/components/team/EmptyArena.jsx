import { motion } from "framer-motion";
import { Brackets, ScanOverlay, Led } from "./bits";
import PixelButton from "../PixelButton";

export default function EmptyArena({ onRefresh }) {
  return (
    <motion.div
      className="relative z-10 arena-empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="arena-empty-frame relative border border-[#FFD21A]/30 bg-[#0a0906] max-w-[640px] mx-auto overflow-hidden">
        <Brackets size={10} color="#FFD21A" />
        <ScanOverlay className="opacity-20" />
        <div className="relative z-[3]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#FFD21A]/18">
            <span className="font-pixel text-[8px] tracking-[0.2em] text-[#FFD21A] flex items-center gap-2">
              <Led color="#FFD21A" size={5} />
              FHC // PLAYER REGISTRY
            </span>
            <span className="font-pixel text-[6px] tracking-[0.14em] text-[#FFF7E5]/22">STATE::EMPTY</span>
          </div>
          <div className="px-6 py-10 text-center">
            <p className="font-pixel text-[12px] sm:text-[14px] text-[#FFF7E5] tracking-[0.12em]">
              NO ACTIVE PLAYERS DETECTED.
            </p>
            <p className="mt-3 font-pixel text-[8px] text-[#FFD21A]/75 tracking-[0.16em]">
              THE ARENA IS CURRENTLY EMPTY_
            </p>
            <p className="mt-5 text-lg text-[#FFF7E5]/45 font-mono max-w-[480px] mx-auto leading-relaxed">
              Add active members to the FHC roster (public.team_members) and
              they will appear here automatically.
            </p>
            <div className="mt-7">
              <PixelButton variant="yellow" size="sm" onClick={onRefresh}>
                REFRESH SECTOR_
              </PixelButton>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
