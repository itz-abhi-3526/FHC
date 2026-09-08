import { useCallback, useEffect, useRef, useState } from "react";
import { formatTeamName } from "../../lib/teamMembers";
import { Led } from "./bits";

function pad2(n) {
  return String(n).padStart(2, "0");
}

const DRAG_THRESHOLD = 5;
const SCROLL_PAGE = 0.8;

function smoothBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

/* SECTOR SELECT — horizontal slider with flanking arrow navigation.
   Click a sector to switch it; drag (mouse), swipe (touch) and
   Arrow-Left/Right (keyboard) also move the strip. The arrows scroll
   the real container — nothing here is a fake visual-only slider. */
export default function TeamSelector({ teams, active, onSelect }) {
  const scrollerRef = useRef(null);
  const dragRef = useRef({ active: false, moved: 0 });
  const [suppressClick, setSuppressClick] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const safeTeams = Array.isArray(teams) ? teams : [];
  const activeIndex = Math.max(
    0,
    safeTeams.findIndex((g) => g.key === active)
  );
  const total = safeTeams.length;

  const updateArrows = useCallback(() => {
    const sc = scrollerRef.current;
    if (!sc) {
      setCanLeft(false);
      setCanRight(false);
      return;
    }
    setCanLeft(sc.scrollLeft > 4);
    setCanRight(sc.scrollLeft < sc.scrollWidth - sc.clientWidth - 4);
  }, []);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    updateArrows();
    sc.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(sc);
    return () => {
      sc.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows]);

  const ensureVisible = useCallback((key) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const el = scroller.querySelector(`[data-team="${key}"]`);
    if (el)
      el.scrollIntoView({ behavior: smoothBehavior(), inline: "center", block: "nearest" });
  }, []);

  useEffect(() => {
    ensureVisible(active);
  }, [active, ensureVisible]);

  const scrollByAmount = useCallback((dir) => {
    const sc = scrollerRef.current;
    if (!sc) return;
    sc.scrollBy({
      left: dir * sc.clientWidth * SCROLL_PAGE,
      behavior: smoothBehavior(),
    });
  }, []);

  const go = useCallback(
    (dir) => {
      if (!safeTeams.length) return;
      const next = (activeIndex + dir + safeTeams.length) % safeTeams.length;
      onSelect(safeTeams[next].key);
    },
    [safeTeams, activeIndex, onSelect]
  );

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (safeTeams[0]) onSelect(safeTeams[0].key);
    } else if (e.key === "End") {
      e.preventDefault();
      if (safeTeams[safeTeams.length - 1]) onSelect(safeTeams[safeTeams.length - 1].key);
    }
  };

  /* Mouse drag scroll — no pointer capture, so tab clicks always land on
     the buttons. The window listeners are cleared on pointerup. */
  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    const sc = scrollerRef.current;
    if (!d.active || !sc) return;
    const dx = e.clientX - d.startX;
    d.moved = dx;
    sc.scrollLeft = d.startLeft - dx;
    if (Math.abs(dx) > DRAG_THRESHOLD) setSuppressClick(true);
  }, []);

  const endDrag = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    window.setTimeout(() => setSuppressClick(false), 0);
  }, [onPointerMove]);

  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse") return;
    const sc = scrollerRef.current;
    if (!sc) return;
    const d = dragRef.current;
    if (d.active) return;
    dragRef.current = {
      active: true,
      moved: 0,
      startX: e.clientX,
      startLeft: sc.scrollLeft,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  return (
    <section className="relative z-10 px-4 sm:px-6 lg:px-8 mt-5">
      <div className="w-full max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-pixel text-[8px] tracking-[0.2em] text-[#FF1687]/65">
              // SECTOR SELECT
            </span>
            <span className="hidden md:block flex-1 h-px bg-[#FFF7E5]/8" />
          </div>
          <span
            className="arena-select-progress font-pixel text-[7px] tracking-[0.2em] text-[#1ED7E8]/70 whitespace-nowrap"
            aria-live="polite"
          >
            SECTOR {pad2(activeIndex + 1)} OF {pad2(total)}
          </span>
        </div>

        <div className="arena-select-row flex items-center gap-2">
          <button
            type="button"
            className={"arena-arrow arena-arrow-left" + (canLeft ? "" : " arena-arrow-off")}
            onClick={() => scrollByAmount(-1)}
            disabled={!canLeft}
            aria-label="Scroll sectors left"
          >
            <span aria-hidden="true">{"<"}</span>
          </button>

          <div
            ref={scrollerRef}
            tabIndex={0}
            role="tablist"
            aria-label="Select FHC team sector"
            aria-keyshortcuts="ArrowLeft ArrowRight Home End"
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            className="arena-select-scroll flex-1 min-w-0"
            style={{ touchAction: "pan-y" }}
          >
            {safeTeams.map((g) => {
              const isActive = g.key === active;
              return (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-team={g.key}
                  onClick={() => {
                    if (suppressClick) return;
                    onSelect(g.key);
                  }}
                  className={"arena-tab " + (isActive ? "arena-tab-active" : "")}
                >
                  <span
                    className={`arena-tab-px ${isActive ? "arena-tab-px-on" : ""}`}
                    aria-hidden="true"
                  />
                  {formatTeamName(g.key)}
                  {isActive && <Led color="#FFF" size={4} className="ml-1" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={"arena-arrow arena-arrow-right" + (canRight ? "" : " arena-arrow-off")}
            onClick={() => scrollByAmount(1)}
            disabled={!canRight}
            aria-label="Scroll sectors right"
          >
            <span aria-hidden="true">{">"}</span>
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <span className="font-pixel text-[6px] tracking-[0.18em] text-[#FFF7E5]/22">
            &lt;&lt; DRAG / SWIPE / ARROWS &gt;&gt;
          </span>
          <span className="font-pixel text-[6px] tracking-[0.18em] text-[#1ED7E8]/30">
            {formatTeamName(active)} ACTIVE
          </span>
        </div>
      </div>
    </section>
  );
}