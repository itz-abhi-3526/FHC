import { useState } from "react";
import Footer from "../components/Footer";
import Mascot from "../components/Mascot";
import PixelButton from "../components/PixelButton";
import SectionEyebrow from "../components/SectionEyebrow";
import { makeTwinkles } from "../lib/random";

const TWINKLES = makeTwinkles(18, 3, 80);

const TABS = [
  "ALL",
  "CORE TEAM",
  "TECHNICAL",
  "DESIGN",
  "MEDIA",
  "EVENTS",
  "DOCUMENTATION",
];

const CORE = [
  { name: "Adithya N.", role: "President", level: 99, hp: 9, xp: 8, photo: "bg-blue", badge: "👑", badgeBg: "bg-pink" },
  { name: "Aleena S.", role: "Vice President", level: 87, hp: 8, xp: 7, photo: "bg-arcade", badge: "⭐", badgeBg: "bg-green" },
  { name: "Gokul P.", role: "Technical Lead", level: 92, hp: 9, xp: 8, photo: "bg-green", badge: "⚡", badgeBg: "bg-orange" },
  { name: "Fathima R.", role: "Design Lead", level: 85, hp: 8, xp: 7, photo: "bg-purple", badge: "✏️", badgeBg: "bg-purple" },
];

const TECHNICAL = [
  { name: "Arjun M.", role: "Web Dev", level: 78, hp: 8, xp: 8, photo: "bg-blue", badge: "💻", badgeBg: "bg-blue" },
  { name: "Sreerag S.", role: "Backend Dev", level: 74, hp: 7, xp: 7, photo: "bg-arcade", badge: "🗄️", badgeBg: "bg-arcade" },
  { name: "Vishnu V.", role: "AI/ML Engineer", level: 71, hp: 7, xp: 7, photo: "bg-green", badge: "🤖", badgeBg: "bg-green" },
  { name: "Abhinav K.", role: "DevOps", level: 70, hp: 7, xp: 6, photo: "bg-purple", badge: "🚀", badgeBg: "bg-purple" },
];

const LISTS = [
  {
    key: "DESIGN",
    icon: "✏️",
    title: "DESIGN TEAM",
    color: "text-pink",
    border: "border-pink",
    shadow: "shadow-[6px_6px_0_0_#C4106A]",
    members: ["Rifa F.", "Josna J.", "Athulya P."],
    level: "Level 65+",
  },
  {
    key: "MEDIA",
    icon: "📷",
    title: "MEDIA TEAM",
    color: "text-purple",
    border: "border-purple",
    shadow: "shadow-[6px_6px_0_0_#7F52BF]",
    members: ["Niranjana K.", "Akhil Raj", "Althaf S."],
    level: "Level 60+",
  },
  {
    key: "EVENTS",
    icon: "📅",
    title: "EVENTS TEAM",
    color: "text-green",
    border: "border-green",
    shadow: "shadow-[6px_6px_0_0_#2ABF4F]",
    members: ["Anagha T.", "Midhun M.", "Alwin J."],
    level: "Level 60+",
  },
  {
    key: "DOCUMENTATION",
    icon: "📖",
    title: "DOCUMENTATION",
    color: "text-blue",
    border: "border-blue",
    shadow: "shadow-[6px_6px_0_0_#438ABF]",
    members: ["Meghna M.", "Sangeeth S.", "Joel J."],
    level: "Level 58+",
  },
];

function Bar({ label, filled, total, fillClass }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="font-pixel text-[8px] text-ink/70 w-5">{label}</span>
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 flex-1 ${
              i < filled ? fillClass : "bg-ink/10 border border-ink/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function MemberCard({ m }) {
  return (
    <article className="bg-cream text-ink border-4 border-ink shadow-[6px_6px_0_0_#0C0C0F] flex flex-col overflow-hidden">
      <div className={`relative h-28 ${m.photo} grid place-items-center`}>
        <span
          className={`absolute right-2 top-2 w-8 h-8 border-2 border-ink grid place-items-center text-base ${m.badgeBg}`}
        >
          {m.badge}
        </span>
        <div className="w-14 h-14 bg-cream border-4 border-ink shadow-[3px_3px_0_0_rgba(0,0,0,0.5)] grid place-items-center font-pixel text-lg text-ink">
          {m.name[0]}
        </div>
        <span className="absolute left-2 bottom-1 font-pixel text-[9px] text-ink/40">
          FHC
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-pixel text-[11px] text-pink mb-1">{m.name}</h3>
        <p className="font-pixel text-[9px] text-blue mb-3">{m.role}</p>
        <p className="font-pixel text-[9px] text-ink/70 mb-3">
          LEVEL {m.level}
        </p>
        <Bar label="HP" filled={m.hp} total={10} fillClass="bg-pink" />
        <Bar label="XP" filled={m.xp} total={10} fillClass="bg-blue" />
        <div className="mt-4 flex gap-2">
          <button
            className="w-8 h-8 bg-ink text-cream font-pixel text-[9px] grid place-items-center hover:bg-pink hover:text-ink transition-colors"
            aria-label={`${m.name} on LinkedIn`}
          >
            in
          </button>
          <button
            className="w-8 h-8 bg-ink text-cream grid place-items-center hover:bg-pink hover:text-ink transition-colors"
            aria-label={`Email ${m.name}`}
          >
            ✉
          </button>
        </div>
      </div>
    </article>
  );
}

function CompactList({ list }) {
  return (
    <div
      className={`bg-cream text-ink border-4 ${list.border} ${list.shadow} p-5 flex flex-col`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl w-10 h-10 bg-ink grid place-items-center">
          {list.icon}
        </span>
        <h3 className={`font-pixel text-[10px] ${list.color}`}>{list.title}</h3>
      </div>
      <ul className="text-xl leading-relaxed flex-1 space-y-1">
        {list.members.map((n) => (
          <li key={n} className="flex items-center gap-2">
            <span className="w-2 h-2 bg-ink inline-block shrink-0" />
            {n}
          </li>
        ))}
      </ul>
      <p className="font-pixel text-[9px] bg-ink text-cream px-2 py-1.5 mt-4 w-fit">
        {list.level}
      </p>
    </div>
  );
}

function TeamHeader() {
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
          <SectionEyebrow tone="sky">TEAM</SectionEyebrow>
          <h1 className="font-pixel text-3xl md:text-5xl text-cream mt-4 mb-6">
            MEET THE TEAM
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed text-cream/80 max-w-lg">
            We are a crew of passionate builders, designers, thinkers and
            dreamers working together to create impact through technology.
          </p>
        </div>

        <div className="relative h-64 flex items-center justify-center">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Mascot size="lg" bubble={<span>♥</span>} />
          </div>
          <div className="absolute left-[6%] bottom-[10%] w-16 h-12 bg-[#d8d8d8] border-4 border-ink shadow-[5px_5px_0_0_#C4106A] flex flex-col animate-float">
            <div className="flex-1 m-1.5 mb-0.5 bg-ink flex items-center justify-center font-pixel text-[10px] text-pink">
              ♥
            </div>
            <div className="h-1.5 bg-[#b8b8b8] border-t-4 border-ink" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-arcade text-ink border-t-4 border-ink px-6 py-12">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-6">
          <Mascot size="lg" bubble={<span>♥</span>} />
          <div>
            <h2 className="font-pixel text-sm md:text-lg mb-2">
              WANT TO BE PART OF OUR CREW?
            </h2>
            <p className="text-xl">Great minds build the future together.</p>
          </div>
        </div>
        <PixelButton to="/join" variant="dark">
          JOIN FHC →
        </PixelButton>
      </div>
    </section>
  );
}

export default function Team() {
  const [tab, setTab] = useState("ALL");
  const show = (t) => tab === "ALL" || tab === t;

  return (
    <>
      <TeamHeader />

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

      {show("CORE TEAM") && (
        <section className="bg-sky-light text-ink border-b-4 border-ink px-6 py-16">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="font-pixel text-sm md:text-base mb-8">
              🔷 CORE TEAM
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CORE.map((m) => (
                <MemberCard key={m.name} m={m} />
              ))}
            </div>
          </div>
        </section>
      )}

      {show("TECHNICAL") && (
        <section className="bg-cream text-ink border-b-4 border-ink px-6 py-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <h2 className="font-pixel text-sm md:text-base">
                💻 TECHNICAL TEAM
              </h2>
              <PixelButton to="/join" variant="pink" size="sm">
                VIEW ALL →
              </PixelButton>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TECHNICAL.map((m) => (
                <MemberCard key={m.name} m={m} />
              ))}
            </div>
          </div>
        </section>
      )}

      {(tab === "ALL" ||
        ["DESIGN", "MEDIA", "EVENTS", "DOCUMENTATION"].includes(tab)) && (
        <section className="bg-sky-light text-ink px-6 py-16">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="font-pixel text-sm md:text-base mb-8">
              THE REST OF THE CREW
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {LISTS.filter(
                (l) => tab === "ALL" || l.key === tab
              ).map((l) => (
                <CompactList key={l.key} list={l} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBanner />

      <Footer
        variant="interior"
        logLines={["FHC_TERMINAL", "Loading awesome people... [OK]"]}
      />
    </>
  );
}