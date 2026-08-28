export default function TerminalLog({ lines, className = "", showDots = true }) {
  return (
    <div
      className={`bg-ink border-[3px] border-ink shadow-[4px_4px_0_0_#FF2E8C] font-mono text-green p-4 text-lg leading-relaxed ${className}`}
    >
      {showDots && (
        <div className="flex gap-2 mb-3">
          <span className="w-3 h-3 bg-pink" />
          <span className="w-3 h-3 bg-arcade" />
          <span className="w-3 h-3 bg-green" />
        </div>
      )}
      {lines.map((line, i) => (
        <p key={i}>
          <span className="text-pink">&gt;</span> {line}
        </p>
      ))}
      <span className="animate-blink">▌</span>
    </div>
  );
}
