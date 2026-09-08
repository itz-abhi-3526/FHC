import { motion } from "framer-motion";
import { Brackets, ScanOverlay, Led } from "./bits";

const EASE = [0.22, 1, 0.36, 1];

export default function LoadingArena() {
  return (
    <motion.div
      className="relative z-10 arena-loading"
      aria-live="polite"
      aria-busy="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Terminal */}
      <div className="arena-loading-terminal relative border border-[#00E5FF]/22 bg-[#03050B] max-w-[560px] mx-auto overflow-hidden">
        <Brackets size={10} color="#1ED7E8" />
        <ScanOverlay className="opacity-30" />
        <div className="relative z-[3]">
          <div className="arena-loading-dots flex gap-2 px-4 py-3 border-b border-[#00E5FF]/12">
            <span className="w-2.5 h-2.5 bg-[#FF1687]" />
            <span className="w-2.5 h-2.5 bg-[#FFD21A]" />
            <span className="w-2.5 h-2.5 bg-[#36D65A]" />
          </div>
          <div className="px-5 py-5 font-mono text-lg leading-[1.9] text-[#1ED7E8]/75">
            <p className="arena-loading-line text-[#36D65A]">&gt; INITIALIZING FHC PLAYER REGISTRY...</p>
            <p className="arena-loading-line text-[#1ED7E8]">&gt; AUTHENTICATING DATA STREAM...</p>
            <p className="arena-loading-line text-[#FFD21A]">&gt; RETRIEVING PLAYER PROFILES...</p>
            <p className="arena-loading-line text-[#36D65A]">
              &gt; SYNCHRONIZING ROSTER...<span className="arena-cursor">|</span>
            </p>
          </div>
        </div>
      </div>

      {/* Skeleton grid */}
      <div className="arena-grid arena-skel-grid mt-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="arena-skel relative border border-[#FFF7E5]/6 bg-[#060a14] overflow-hidden">
            <div className="arena-skel-head flex items-center justify-between px-3 py-2.5 border-b border-[#FFF7E5]/5">
              <span className="arena-skel-bar w-16" />
              <span className="arena-skel-bar w-10" />
            </div>
            <div className="arena-skel-photo" />
            <div className="p-4">
              <span className="arena-skel-bar w-3/4 mb-3" />
              <span className="arena-skel-bar w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
