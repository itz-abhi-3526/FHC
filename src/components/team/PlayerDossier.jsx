import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTeamName, safeSocialUrl } from "../../lib/teamMembers";
import { Led, Brackets, ScanOverlay } from "./bits";
import PlayerPhoto from "./PlayerPhoto";

const SOCIAL_BASES = {
  github: "https://github.com/",
  linkedin: "https://www.linkedin.com/in/",
  instagram: "https://www.instagram.com/",
};

const SOCIAL_ICONS = {
  github: "</>",
  linkedin: "in",
  instagram: "IG",
};

function truncateBio(bio, maxLen = 600) {
  if (!bio) return "";
  return bio.length > maxLen ? bio.slice(0, maxLen) + "..." : bio;
}

export default function PlayerDossier({ player, pid, onClose }) {
  const closeRef = useRef(null);
  const panelRef = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => {
    if (!player) return;
    prevFocus.current = document.activeElement;
    closeRef.current?.focus();

    document.body.style.overflow = "hidden";

    const FOCUSABLE =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll(FOCUSABLE)
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus.current?.focus?.();
    };
  }, [player, onClose]);

  const hasBio = Boolean(player?.bio);
  const socials = [];
  if (player?.github_url) socials.push({ key: "github", label: "GitHub", url: safeSocialUrl(player.github_url, SOCIAL_BASES.github) });
  if (player?.linkedin_url) socials.push({ key: "linkedin", label: "LinkedIn", url: safeSocialUrl(player.linkedin_url, SOCIAL_BASES.linkedin) });
  if (player?.instagram_url) socials.push({ key: "instagram", label: "Instagram", url: safeSocialUrl(player.instagram_url, SOCIAL_BASES.instagram) });

  return (
    <AnimatePresence>
      {player && (
        <motion.div
          className="arena-overlay fixed inset-0 z-[20000] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 arena-overlay-bg"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Dossier panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Player dossier for ${player.name}`}
            tabIndex={-1}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="arena-dossier relative w-full max-w-[960px] max-h-[90dvh] overflow-y-auto z-[20001]"
            ref={panelRef}
          >
            <Brackets size={14} color="#FF1687" />
            <ScanOverlay />

            {/* Title bar */}
            <div className="arena-dossier-head sticky top-0 z-[5] flex items-center justify-between px-5 py-3 bg-[#05080f]/95 border-b border-[#00E5FF]/12" style={{ backdropFilter: "blur(8px)" }}>
              <div className="flex items-center gap-3">
                <Led color="#FF1687" />
                <span className="font-pixel text-[8px] tracking-[0.2em] text-[#FFF7E5]/65">
                  FHC // PLAYER DOSSIER
                </span>
                <span className="hidden sm:inline font-pixel text-[7px] tracking-[0.18em] text-[#1ED7E8]/65">
                  {pid}
                </span>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="arena-dossier-close font-pixel text-[9px] px-3 py-2"
                aria-label="Close dossier"
              >
                X CLOSE
              </button>
            </div>

            {/* Content */}
            <div className="relative z-[3] grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 p-5 sm:p-7">
              {/* Photo */}
              <div className="relative">
                <div className="arena-dossier-photo relative border border-[#FFF7E5]/8 bg-[#080a11]">
                  <PlayerPhoto
                    member={player}
                    alt={`${player.name} -- ${player.designation || "FHC player"}`}
                    eager
                  />
                </div>
                <p className="arena-dossier-photo-cap mt-2 text-center font-pixel text-[6px] text-[#FFF7E5]/25">
                  IDENTITY_CAPTURE
                </p>
              </div>

              {/* Data */}
              <div className="min-w-0">
                <div className="arena-dossier-row-grid">
                  <div>
                    <span className="arena-dossier-key font-pixel text-[6px] text-[#1ED7E8]/55">
                      IDENTITY
                    </span>
                    <p className="font-pixel text-[14px] sm:text-[16px] text-[#FFF7E5] mt-1 break-words leading-relaxed">
                      {player.name}
                    </p>
                  </div>
                  <div>
                    <span className="arena-dossier-key font-pixel text-[6px] text-[#1ED7E8]/55">
                      ROLE
                    </span>
                    <p className="font-pixel text-[9px] text-[#FF1687] mt-1">
                      {player.designation || "OPERATOR"}
                    </p>
                  </div>
                  <div>
                    <span className="arena-dossier-key font-pixel text-[6px] text-[#1ED7E8]/55">
                      DIVISION
                    </span>
                    <p className="font-pixel text-[9px] text-[#1ED7E8] mt-1">
                      {formatTeamName(player.team)}
                    </p>
                  </div>
                  <div>
                    <span className="arena-dossier-key font-pixel text-[6px] text-[#1ED7E8]/55">
                      STATUS
                    </span>
                    <p className="font-pixel text-[9px] text-[#36D65A] mt-1 flex items-center gap-2">
                      <Led color="#36D65A" size={5} />
                      ACTIVE
                    </p>
                  </div>
                </div>

                {hasBio && (
                  <div className="mt-6 pt-5 border-t border-[#FFF7E5]/6">
                    <span className="arena-dossier-key font-pixel text-[6px] text-[#1ED7E8]/55">
                      // BIO
                    </span>
                    <p className="mt-3 text-xl md:text-2xl text-[#FFF7E5]/65 font-mono leading-relaxed">
                      {truncateBio(player.bio)}
                    </p>
                  </div>
                )}

                {socials.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-[#FFF7E5]/6">
                    <span className="arena-dossier-key font-pixel text-[6px] text-[#1ED7E8]/55">
                      // NETWORK LINKS
                    </span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {socials.map((s) => (
                        <a
                          key={s.key}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="arena-social px-3 py-2 font-pixel text-[8px] tracking-[0.14em] border border-[#00E5FF]/22 text-[#FFF7E5]/75 hover:border-[#FF1687]/50 hover:text-[#FFF7E5] transition-all"
                          aria-label={`${player.name} on ${s.label} (opens in new tab)`}
                        >
                          <span className="mr-2" aria-hidden="true">
                            {SOCIAL_ICONS[s.key] || ""}
                          </span>
                          {s.label}
                          <span className="ml-1 opacity-50" aria-hidden="true">&#x2197;</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-[#00E5FF]/10 flex items-center justify-between">
                  <span className="font-pixel text-[6px] tracking-[0.18em] text-[#FFF7E5]/25">
                    FHC // NODE_01 - SIGNAL LOCKED
                  </span>
                  <span className="font-pixel text-[6px] tracking-[0.18em] text-[#36D65A]/55 flex items-center gap-2">
                    <Led color="#36D65A" size={5} />
                    ANCHORED
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
