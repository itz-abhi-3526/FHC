import { motion } from "framer-motion";
import { Brackets, ScanOverlay, Led } from "./bits";
import PixelButton from "../PixelButton";

export default function ErrorArena({ onRetry }) {
  return (
    <motion.div
      className="relative z-10 arena-error"
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="arena-error-frame relative border border-[#FF1687]/40 bg-[#0a0408] max-w-[640px] mx-auto overflow-hidden">
        <Brackets size={10} color="#FF1687" />
        <ScanOverlay className="opacity-30" />
        <div className="relative z-[3]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#FF1687]/18">
            <span className="font-pixel text-[8px] tracking-[0.2em] text-[#FF1687] flex items-center gap-2">
              <Led color="#FF1687" size={5} />
              [!] SYSTEM MESSAGE
            </span>
            <span className="font-pixel text-[6px] tracking-[0.14em] text-[#FFF7E5]/25">ERR_0x1A</span>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="font-pixel text-[13px] sm:text-[15px] text-[#FF1687] tracking-[0.12em]">
              [!] PLAYER REGISTRY OFFLINE
            </p>
            <p className="mt-4 text-xl text-[#FFF7E5]/65 font-mono leading-relaxed max-w-[520px] mx-auto">
              UNABLE TO ESTABLISH CONNECTION
              <br />
              WITH THE FHC PLAYER DATABASE.
            </p>
            <div className="mt-7">
              <PixelButton variant="pink" size="md" onClick={onRetry}>
                RETRY CONNECTION_
              </PixelButton>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
