export default function Mascot({
  className = "",
  bubble,
  bubbleClass = "",
  size = "md",
}) {
  const scale = { sm: "scale-75", md: "scale-100", lg: "scale-150" }[size];

  return (
    <div className={`relative inline-block ${className}`} aria-hidden="true">
      {bubble !== undefined && (
        <div
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 ${bubbleClass}`}
        >
          <div className="relative bg-cream border-[3px] border-ink shadow-[3px_3px_0_0_#0C0C0F] px-2.5 py-1.5 font-pixel text-[9px] text-ink whitespace-nowrap">
            {bubble}
            <span className="absolute left-1/2 -bottom-[8px] -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-ink" />
          </div>
        </div>
      )}

      <div className={`relative w-12 h-16 ${scale} origin-bottom`}>
        {/* antenna */}
        <span className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-2 bg-ink" />
        <span className="absolute left-1/2 top-0 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-pink border-2 border-ink" />

        {/* head / screen face */}
        <div className="absolute left-1/2 top-1.5 -translate-x-1/2 w-8 h-7 bg-ink border-[3px] border-ink">
          <div className="absolute inset-[3px] bg-sky flex items-center justify-center gap-[3px]">
            <span className="w-[3px] h-2.5 bg-pink" />
            <span className="w-[3px] h-2.5 bg-pink" />
          </div>
        </div>

        {/* body */}
        <div className="absolute left-1/2 -translate-x-1/2 top-9 w-9 h-5 bg-ink" />

        {/* arms */}
        <div className="absolute top-9 left-0 w-2 h-2 bg-ink" />
        <div className="absolute top-[42px] left-[-2px] w-2.5 h-2.5 bg-ink" />
        <div className="absolute top-9 right-0 w-2 h-2 bg-ink" />
        <div className="absolute top-[42px] right-[-2px] w-2.5 h-2.5 bg-ink" />

        {/* legs */}
        <div className="absolute top-14 left-[7px] w-2.5 h-2 bg-ink" />
        <div className="absolute top-14 right-[7px] w-2.5 h-2 bg-ink" />
      </div>
    </div>
  );
}
