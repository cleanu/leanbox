/** Infinite CSS marquee (paused automatically for reduced motion via globals.css). */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = [...items, ...items];
  return (
    <div className={className} aria-hidden>
      <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
        {[0, 1].map((k) => (
          <div key={k} className="flex items-center">
            {row.map((item, i) => (
              <span key={`${k}-${i}`} className="flex items-center">
                <span className="px-7 font-serif text-2xl font-black tracking-tight sm:text-4xl">{item}</span>
                <span className="size-2 rounded-full bg-current opacity-50" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
