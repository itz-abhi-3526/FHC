import { useState } from "react";
import Footer from "../components/Footer";
import Mascot from "../components/Mascot";
import PixelButton from "../components/PixelButton";
import SectionEyebrow from "../components/SectionEyebrow";
import { makeTwinkles } from "../lib/random";

const TWINKLES = makeTwinkles(18, 9, 80);

const TABS = [
  "ALL",
  "EVENTS",
  "WORKSHOPS",
  "HACKATHONS",
  "TECH TALKS",
  "OUTREACH",
  "FUN MOMENTS",
];

const CATS = {
  EVENT: { tag: "bg-pink text-ink", title: "text-pink", badge: "🤖" },
  WORKSHOP: { tag: "bg-blue text-ink", title: "text-blue", badge: "🖥️" },
  "TECH TALK": { tag: "bg-arcade text-ink", title: "text-arcade", badge: "🎤" },
  HACKATHON: { tag: "bg-green text-ink", title: "text-green", badge: "⌨️" },
  "FUN MOMENTS": { tag: "bg-purple text-ink", title: "text-purple", badge: "🎉" },
  OUTREACH: { tag: "bg-orange text-ink", title: "text-orange", badge: "🤝" },
};

const PHOTOS = [
  {
    title: "HORIZON 3.0",
    cat: "EVENT",
    desc: "Our annual tech fest that brings innovators together.",
    date: "Mar 15, 2025",
    count: 42,
    badge: "🏆",
  },
  {
    title: "WEB DEV WORKSHOP",
    cat: "WORKSHOP",
    desc: "Hands-on session on modern web development.",
    date: "Feb 22, 2025",
    count: 28,
    badge: "🖥️",
  },
  {
    title: "AI & BEYOND",
    cat: "TECH TALK",
    desc: "Exploring the impact of AI in our everyday life.",
    date: "Jan 30, 2025",
    count: 31,
    badge: "🎤",
  },
  {
    title: "CODE HORIZON",
    cat: "HACKATHON",
    desc: "24 hours of code, coffee and collaboration.",
    date: "Nov 18, 2024",
    count: 56,
    badge: "⌨️",
  },
  {
    title: "CODE FOR GOOD",
    cat: "EVENT",
    desc: "Using technology to make a positive impact.",
    date: "Oct 05, 2024",
    count: 24,
    badge: "💚",
  },
  {
    title: "BEYOND CODE :)",
    cat: "FUN MOMENTS",
    desc: "Because the best memories happen off the screen.",
    date: "Sep 10, 2024",
    count: 18,
    badge: "🎉",
  },
];

function CameraSprite() {
  return (
    <div className="relative w-28 h-20 animate-float" aria-hidden="true">
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-14 bg-ink border-4 border-ink rounded-md shadow-[5px_5px_0_0_#C4106A]">
        <div className="absolute inset-1 bg-[#d8d8d8] flex items-center justify-center">
          <span className="w-9 h-9 rounded-full border-4 border-ink bg-sky grid place-items-center text-sm">
            ⚡
          </span>
        </div>
      </div>
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-2 bg-[#b8b8b8] border-2 border-ink" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-2.5 bg-ink" />
    </div>
  );
}

function GalleryHeader() {
  return (
    <section className="relative overflow-hidden bg-ink text-cream border-b-4 border-ink px-6 py-16 md:py-20">
      {TWINKLES.map((s) => (
        <span
          key={s.id}
          className="absolute text-sky/40 text-base animate-twinkle pointer-events-none"
          style={{ left: s.left, top: s.top, animationDelay: s.delay }}
        >
          {s.glyph}
        </span>
      ))}

      <div className="relative z-10 max-w-[1200px] mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <SectionEyebrow>MEMORIES</SectionEyebrow>
          <h1 className="font-pixel text-3xl md:text-5xl text-cream mt-4 mb-6 pb-4 border-b-4 border-pink inline-block">
            GALLERY_
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed text-cream/80 max-w-lg">
            A glimpse of our journey, events, workshops and memories built
            together.
          </p>
        </div>

        <div className="relative h-64 flex items-center justify-center">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Mascot size="lg" bubble={<span>📷</span>} />
          </div>
          <div className="absolute right-[8%] bottom-[6%]">
            <CameraSprite />
          </div>
          <div className="absolute left-[8%] top-[8%] w-10 h-10 bg-pink border-4 border-ink shadow-[4px_4px_0_0_#C4106A] grid place-items-center text-lg animate-float">
            ♥
          </div>
        </div>
      </div>
    </section>
  );
}

function PhotoCard({ p }) {
  const cat = CATS[p.cat];
  return (
    <article className="bg-cream text-ink border-4 border-ink shadow-[8px_8px_0_0_#0C0C0F] flex flex-col overflow-hidden">
      <div className="relative h-40 bg-ink grid place-items-center">
        <span
          className={`absolute left-2 top-2 font-pixel text-[9px] px-2 py-1 border-2 border-ink ${cat.tag}`}
        >
          {p.cat}
        </span>
        <span className="absolute right-2 top-2 w-9 h-9 bg-cream border-2 border-ink grid place-items-center text-lg">
          {p.badge}
        </span>
        <div className="w-full h-full bg-ink/20 flex items-center justify-center">
          <span className="bg-cream border-2 border-ink font-pixel text-[8px] text-ink/70 px-2 py-1.5">
            📷 PHOTO PLACEHOLDER
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className={`font-pixel text-[11px] mb-2 ${cat.title}`}>
          {p.title}
        </h3>
        <p className="text-lg leading-snug text-ink/90 flex-1 mb-4">{p.desc}</p>
        <div className="flex items-center justify-between border-t-2 border-ink/10 pt-3 text-lg">
          <span className="flex items-center gap-2">
            <span aria-hidden>📅</span>
            {p.date}
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden>🗂️</span>
            {p.count} photos
          </span>
        </div>
      </div>
    </article>
  );
}

function Pagination() {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mt-10">
      <button className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-ink bg-cream text-ink font-pixel text-sm grid place-items-center hover:bg-pink transition-colors">
        ‹
      </button>
      {["1", "2", "3", "…", "7"].map((p) => (
        <button
          key={p}
          className={`w-8 h-8 sm:w-10 sm:h-10 border-2 border-ink font-pixel text-sm grid place-items-center ${
            p === "1" ? "bg-pink text-ink" : "bg-cream text-ink hover:bg-sky"
          }`}
        >
          {p}
        </button>
      ))}
      <button className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-ink bg-cream text-ink font-pixel text-sm grid place-items-center hover:bg-pink transition-colors">
        ›
      </button>
    </div>
  );
}

function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-arcade text-ink border-t-4 border-ink px-6 py-12">
      <div className="relative z-10 max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-6">
          <span className="hidden sm:grid w-16 h-16 bg-ink border-4 border-ink shadow-[5px_5px_0_0_#C4106A] place-items-center text-3xl">
            📷
          </span>
          <div>
            <h2 className="font-pixel text-sm md:text-lg mb-2">
              HAVE MORE MEMORIES TO ADD?
            </h2>
            <p className="text-xl">Share your photos with the FHC community!</p>
          </div>
        </div>
        <PixelButton to="/join" variant="dark">
          ▶ SHARE PHOTOS
        </PixelButton>
      </div>
      <div className="absolute -bottom-6 right-8 w-24 h-12 bg-cream border-4 border-ink rounded-full" />
    </section>
  );
}

export default function Gallery() {
  const [tab, setTab] = useState("ALL");

  const shown = tab === "ALL" ? PHOTOS : PHOTOS.filter((p) => p.cat === tab);

  return (
    <>
      <GalleryHeader />

      <section className="bg-cream text-ink border-b-4 border-ink px-6 py-10">
        <div className="max-w-[1200px] mx-auto flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-pixel text-[10px] px-4 py-2.5 rounded-full border-2 transition-colors ${
                tab === t
                  ? "bg-pink text-ink border-ink"
                  : "bg-ink text-cream border-cream hover:bg-pink hover:text-ink hover:border-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-sky-light text-ink border-b-4 border-ink px-6 py-16">
        <div className="max-w-[1200px] mx-auto">
          {shown.length === 0 ? (
            <div className="bg-cream border-4 border-dashed border-ink p-10 text-center">
              <p className="font-pixel text-sm text-ink mb-3">
                NO MEMORIES IN THIS CATEGORY YET_
              </p>
              <p className="text-xl text-ink/70">
                Drop by our events and be the first to fill this slot!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((p) => (
                <PhotoCard key={p.title} p={p} />
              ))}
            </div>
          )}

          <Pagination />
        </div>
      </section>

      <CtaBanner />

      <Footer
        variant="interior"
        logLines={[
          "FHC_TERMINAL",
          "Loading memories...",
          "Moments loaded successfully!",
        ]}
      />
    </>
  );
}