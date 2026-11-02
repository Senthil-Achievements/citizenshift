const ITEMS = [
  "Understand Legislation",
  "Track What Matters",
  "Federal",
  "State",
  "Municipal",
  "Search Congress",
  "Contact Your Representative",
  "Make Your Voice Heard",
  "Nonpartisan",
];

/** Ticker — a quiet marquee band that separates hero from content. */
export default function Ticker() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div
      className="ticker relative overflow-hidden border-y border-icy/20 bg-navy-900 py-3.5 text-icy/80"
      aria-hidden="true"
    >
      <div className="ticker-track">
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-6 pr-6 font-mono text-[11px] uppercase tracking-[0.24em] sm:pr-10 sm:text-xs">
            {item}
            <span className="text-berry">✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}
