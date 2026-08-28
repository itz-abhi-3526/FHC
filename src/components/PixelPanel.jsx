const SHADOWS = {
  ink: "#0C0C0F",
  pink: "#C4106A",
  arcade: "#BF9F00",
  yellow: "#BF9F00",
  cream: "#0C0C0F",
  green: "#2ABF4F",
  blue: "#438ABF",
  purple: "#7F52BF",
  orange: "#BF792D",
  teal: "#239A97",
};

export default function PixelPanel({
  accentColor = "ink",
  bg = "bg-cream",
  className = "",
  children,
  ...rest
}) {
  const shadow = SHADOWS[accentColor] ?? SHADOWS.ink;

  return (
    <div
      className={`border-4 border-ink shadow-[6px_6px_0_0_${shadow}] ${bg} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
