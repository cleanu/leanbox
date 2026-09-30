export function AuthHeading({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede?: string }) {
  return (
    <header className="mb-9">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="mt-3 text-[2.4rem] leading-tight">{title}</h1>
      {lede ? <p className="mt-3 text-[0.95rem] leading-relaxed text-mute">{lede}</p> : null}
    </header>
  );
}
