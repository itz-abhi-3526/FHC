import { Link } from 'react-router-dom';
import fhc2Console from '../assets/fhc2.png';

const LINKS = [
  { label: "EVENTS", to: "/#events" },
  { label: "PROJECTS", to: "/#projects" },
  { label: "TEAM", to: "/team" },
  { label: "GALLERY", to: "/gallery" },
  { label: "ABOUT", to: "/about" },
  { label: "JOIN US", to: "/join" },
];

const SOCIALS = [
  { label: "GH", title: "GitHub", url: "https://github.com/fhc-fisat" },
  { label: "LI", title: "LinkedIn", url: "https://linkedin.com/company/fhc-fisat" },
  { label: "IG", title: "Instagram", url: "https://instagram.com/fhc.fisat" },
  { label: "EM", title: "Email", url: "mailto:fhc@fisat.ac.in" },
];

function PixelSpeechBubble() {
  return (
    <div className="relative">
      <div
        className="bg-cream text-ink text-[7px] font-pixel leading-[1.6] px-3 py-2 border-2 border-ink"
        style={{
          clipPath:
            "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 12px 100%, 8px calc(100% + 6px), 18px 100%, 4px 100%, 0 calc(100% - 4px))",
          width: 100,
        }}
      >
        LET&apos;S BUILD<br />THE FUTURE<br />TOGETHER!_
      </div>
    </div>
  );
}

function SocialButton({ label, title, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="w-8 h-8 bg-ink border-2 border-cream text-cream text-[9px] font-pixel flex items-center justify-center hover:bg-pink hover:border-pink transition-colors duration-150 active:translate-x-[2px] active:translate-y-[2px]"
    >
      {label}
    </a>
  );
}

export default function Footer({ currentYear = 2025, clubName = "FISAT HORIZON CLUB" }) {
  return (
    <footer className="w-full select-none font-mono">
      {/* MAIN PINK FOOTER */}
      <div className="relative bg-pink border-4 border-ink overflow-hidden">
        <div className="absolute inset-[4px] border-2 border-ink/30 pointer-events-none" />
        {/* Corner brackets — white L-shapes */}
        <div className="absolute top-[8px] left-[8px] z-30 pointer-events-none">
          <div style={{ width: 10, height: 2, background: "white", opacity: 0.6 }} />
          <div style={{ width: 2, height: 10, background: "white", opacity: 0.6 }} />
        </div>
        <div className="absolute top-[8px] right-[8px] z-30 pointer-events-none" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ width: 10, height: 2, background: "white", opacity: 0.6 }} />
          <div style={{ width: 2, height: 10, background: "white", opacity: 0.6, alignSelf: "flex-end" }} />
        </div>
        <div className="absolute bottom-[8px] left-[8px] z-30 pointer-events-none" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ width: 2, height: 10, background: "white", opacity: 0.6 }} />
          <div style={{ width: 10, height: 2, background: "white", opacity: 0.6 }} />
        </div>
        <div className="absolute bottom-[8px] right-[8px] z-30 pointer-events-none" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
          <div style={{ width: 2, height: 10, background: "white", opacity: 0.6, alignSelf: "flex-end" }} />
          <div style={{ width: 10, height: 2, background: "white", opacity: 0.6 }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
          <div className="footer-grid">

            {/* COL 1: ROBOT */}
            <div className="footer-col">
              <div className="flex flex-col items-center gap-2">
                <PixelSpeechBubble />
                <img
                  src="/assets/fhc-loader/hero-robot.png"
                  alt="FHC Robot Mascot"
                  style={{ height: 110, imageRendering: "pixelated" }}
                  className="block"
                />
              </div>
            </div>

            {/* COL 2: FHC CLUB */}
            <div className="footer-col">
              <h3 className="font-pixel text-[11px] text-ink tracking-wider mb-2">
                FISAT HORIZON CLUB
              </h3>
              <p className="font-pixel text-[7px] text-ink/80 leading-[1.6] mb-2">
                THE OFFICIAL TECH CLUB OF<br />
                CSE DEPARTMENT, FISAT.
              </p>
              <div className="flex gap-1.5">
                {SOCIALS.map((s) => (
                  <SocialButton key={s.label} {...s} />
                ))}
              </div>
            </div>

            {/* COL 3: QUICK LINKS */}
            <div className="footer-col">
              <h3 className="font-pixel text-[11px] text-ink tracking-wider mb-2">
                QUICK LINKS
              </h3>
              <ul className="flex flex-col gap-1.5">
                {LINKS.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="font-pixel text-[8px] text-ink hover:text-white transition-colors duration-150 flex items-center group"
                    >
                      <span className="text-ink/50 mr-1.5 group-hover:text-white transition-colors">&gt;</span>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* COL 4: CONTACT + CONSOLE */}
            <div className="footer-col">
              <div className="footer-col-4-inner">
                <div>
                  <h3 className="font-pixel text-[11px] text-ink tracking-wider mb-2">
                    CONTACT
                  </h3>
                  <div className="flex flex-col gap-1.5 font-pixel text-[7px] text-ink">
                    <p>FISAT, ANGAMALY</p>
                    <p>KERALA, INDIA</p>
                    <p className="border-b border-ink/40 pb-0.5">FHC@FISAT.AC.IN</p>
                    <p>WWW.FHC.FISAT.AC.IN</p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center">
                  <img
                    src={fhc2Console}
                    alt="FHC Retro Console"
                    style={{ width: 130, imageRendering: "pixelated" }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* BLACK STATUS BAR */}
      <div className="relative bg-ink border-4 border-ink border-t-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 relative z-10">
          <div className="font-pixel text-[7px] text-cream/70 tracking-wide text-center sm:text-left">
            &copy; {currentYear} {clubName} &bull; ALL RIGHTS RESERVED
          </div>
          <div className="font-pixel text-[8px] text-pink tracking-wider flex items-center gap-1">
            <span className="animate-blink">PRESS START TO CONNECT_</span>
            <img
              src="/assets/fhc-loader/pixel-heart.png"
              alt=""
              style={{ width: 10, height: 10, imageRendering: "pixelated" }}
            />
          </div>
        </div>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-pink" />
      </div>

      <style>{`
        /* MOBILE: single column */
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: center;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 8px 0;
        }

        .footer-col-4-inner {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* DESKTOP >= 1100px: 4 columns with border dividers */
        @media (min-width: 1100px) {
          .footer-grid {
            grid-template-columns: 1fr 1.25fr 1fr 1.5fr;
            gap: 0;
            align-items: center;
          }

          .footer-col {
            padding: 0 20px;
          }

          /* Dividers via border-right on first 3 columns */
          .footer-col:nth-child(1),
          .footer-col:nth-child(2),
          .footer-col:nth-child(3) {
            border-right: 2px solid rgba(12, 12, 15, 0.4);
            height: 70%;
            align-self: center;
          }

          .footer-col-4-inner {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            gap: 16px;
          }
        }
      `}</style>
    </footer>
  );
}
