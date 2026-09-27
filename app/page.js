"use client";
import { products, formatHkd } from "../lib/products";
import { useEffect, useState } from "react";
function Photo({ src, label }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return <div className="placeholder">{label || "Photo"}</div>;
  return <img src={src} alt={label || ""} onError={() => setFailed(true)} />;
}
export default function HomePage() {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach((el) => io.observe(el));
    const hero = document.querySelector(".hero-photo img, .hero-photo .placeholder");
    const onScroll = () => {
      const y = Math.min(window.scrollY, 700);
      if (hero) hero.style.transform = `translateY(${y * 0.18}px) scale(${1.06 - y * 0.00008})`;
      document.documentElement.style.setProperty("--nav-a", y > 20 ? "0.88" : "0.78");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);
  async function buy(id) {
    setBusy(id); setError("");
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) { setError(e.message); setBusy(null); }
  }
  return (
    <>
      <nav className="nav">
        <a className="brand" href="/"><img src="/logo-mark.png" alt="LeanBox" className="nav-logo" /></a>
        <div className="nav-links"><a href="#menu">Menu</a><a href="#how">How it works</a><a href="#faq">FAQ</a></div>
        <a className="nav-buy" href="#menu">Buy</a>
      </nav>
      <section className="hero">
        <img src="/logo.png" alt="LeanBox" className="hero-logo reveal in" data-reveal />
        <div className="eyebrow reveal in" data-reveal>Hong Kong · Prepared meals</div>
        <h1 className="reveal in" data-reveal style={{ "--d": "80ms" }}>The meal.<br />Rebuilt.</h1>
        <p className="sub reveal in" data-reveal style={{ "--d": "160ms" }}>High-protein boxes for training weeks. Heat in three minutes. Macros on the lid.</p>
        <div className="hero-actions reveal in" data-reveal style={{ "--d": "240ms" }}><a className="link" href="#menu">Buy →</a><a className="link" href="#how">Learn more →</a></div>
        <div className="hero-photo reveal in" data-reveal style={{ "--d": "320ms" }}><Photo src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1800&q=80" label="Hero meal" /></div>
      </section>
      <section className="band">
        <h2 className="reveal" data-reveal>Designed for the week you actually train.</h2>
        <p className="reveal" data-reveal style={{ "--d": "90ms" }}>Protein-first plates for cut, perform, or everyday balance.</p>
        <div className="stats">
          <div className="stat reveal" data-reveal><b>30–48g</b><span>protein per meal</span></div>
          <div className="stat reveal" data-reveal style={{ "--d": "120ms" }}><b>3 min</b><span>to heat and eat</span></div>
          <div className="stat reveal" data-reveal style={{ "--d": "240ms" }}><b>12</b><span>meals in the athlete pack</span></div>
        </div>
      </section>
      <section className="grid-wrap" id="menu">
        <div className="eyebrow reveal" data-reveal style={{ color: "#798867" }}>Lineup</div>
        <h2 className="reveal" data-reveal>A box for every session.</h2>
        {error ? <p className="err">{error}</p> : null}
        <div className="grid">{products.map((p, i) => (
          <article className="tile reveal" data-reveal style={{ "--d": `${i * 90}ms` }} key={p.id}>
            <div className="shot"><Photo src={p.image} label={p.short} /></div>
            <div className="body"><h3>{p.short}</h3><p>{p.desc}</p><div className="row"><span>{formatHkd(p.priceHkd)}</span><button className="buy" disabled={busy === p.id} onClick={() => buy(p.id)}>{busy === p.id ? "Opening…" : "Buy"}</button></div></div>
          </article>
        ))}</div>
      </section>
      {products.map((p) => (
        <section className={`chapter ${p.theme}`} key={`ch-${p.id}`}>
          <div className="eyebrow reveal" data-reveal>{p.tag}</div>
          <h2 className="reveal" data-reveal>{p.name}</h2>
          <div className="meta reveal" data-reveal>{p.kcal ? `${p.kcal} kcal · P ${p.protein} · C ${p.carbs} · F ${p.fat}` : "Mixed rotation · delivery included"}</div>
          <p className="copy reveal" data-reveal>{p.desc}</p>
          <div className="price reveal" data-reveal>{formatHkd(p.priceHkd)}</div>
          <button className="buy reveal" data-reveal disabled={busy === p.id} onClick={() => buy(p.id)}>{busy === p.id ? "Opening…" : "Buy"}</button>
          <div className="photo reveal zoom" data-reveal><Photo src={p.image} label={p.short} /></div>
        </section>
      ))}
      <section className="how" id="how">
        <h2 className="reveal" data-reveal>As simple as it looks.</h2>
        <div className="steps">
          <div className="step reveal" data-reveal><em>01</em><h3>Pick a box</h3><p>Single meals or the 12-pack.</p></div>
          <div className="step reveal" data-reveal style={{ "--d": "140ms" }}><em>02</em><h3>Pay on Stripe</h3><p>Secure card checkout.</p></div>
          <div className="step reveal" data-reveal style={{ "--d": "280ms" }}><em>03</em><h3>Heat and eat</h3><p>Microwave two to three minutes.</p></div>
        </div>
      </section>
      <section className="faq" id="faq">
        <div className="faq-inner">
          <h2 className="reveal" data-reveal>Questions.</h2>
          <div className="qa reveal" data-reveal><b>Where do you deliver?</b><p>HK Island, Kowloon, and selected NT.</p></div>
          <div className="qa reveal" data-reveal style={{ "--d": "80ms" }}><b>How do I heat a box?</b><p>Microwave 2–3 minutes.</p></div>
          <div className="qa reveal" data-reveal style={{ "--d": "160ms" }}><b>Allergens?</b><p>hello@leanbox.hk</p></div>
        </div>
      </section>
      <footer>© {new Date().getFullYear()} LeanBox · Hong Kong</footer>
    </>
  );
}
