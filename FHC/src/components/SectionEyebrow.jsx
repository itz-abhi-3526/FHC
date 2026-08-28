const TONES = {
  pink: "text-pink",
  sky: "text-sky",
  green: "text-green",
};

export default function SectionEyebrow({ children, tone = "pink", className = "" }) {
  return (
    <p className={`font-pixel text-[11px] ${TONES[tone]} ${className}`}>
      {"// "}
      {children}
    </p>
  );
}
