"use client";

import { products, formatHkd } from "../lib/products";
import { useState } from "react";

function Photo({ src, label }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return <div className="placeholder">{label || "Photo"}</div>;
  }
  return <img src={src} alt={label || ""} onError={() => setFailed(true)} />;
}

export default function HomePage() {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function buy(id) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setBusy(null);
    }
  }

  return (
    <>
      <nav className="nav">
        <div className="brand">LEANBOX</div>
        <div className="nav-links">
          <a href="#menu">Menu</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </div>
        <a className="nav-buy" href="#menu">Buy</a>
      </nav>

      <section className="hero">
        <div className="eyebrow">Hong Kong · Prepared meals</div>
        <h1>The meal.<br />Rebuilt.</h1>
        <p className="sub">
          High-protein boxes for training weeks. Heat in three minutes.
          Macros on the lid.
        </p>
        <div className="hero-actions">
          <a className="link" href="#menu">Buy →</a>
          <a className="link" href="#how">Learn more →</a>
        </div>
        <div className="hero-photo">
          <Photo
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1800&q=80"
            label="Hero meal"
          />
        </div>
      </section>

      <section className="band">
        <h2>Designed for the week you actually train.</h2>
        <p>
          Not office salad. Protein-first plates, portioned for cut, perform,
          or everyday balance. Delivery across HK Island, Kowloon, and selected NT.
        </p>
        <div className="stats">
          <div className="stat"><b>30–48g</b><span>protein per meal</span></div>
          <div className="stat"><b>3 min</b><span>to heat and eat</span></div>
          <div className="stat"><b>12</b><span>meals in the athlete pack</span></div>
        </div>
      </section>

      <section className="grid-wrap" id="menu">
        <div className="eyebrow" style={{ color: "#0071e3" }}>Lineup</div>
        <h2>A box for every session.</h2>
        {error ? <p className="err">{error}</p> : null}
        <div className="grid">
          {products.map((p) => (
            <article className="tile" key={p.id}>
              <div className="shot">
                <Photo src={p.image} label={p.short} />
              </div>
              <div className="body">
                <h3>{p.short}</h3>
                <p>{p.desc}</p>
                <div className="row">
                  <span>{formatHkd(p.priceHkd)}</span>
                  <button className="buy" disabled={busy === p.id} onClick={() => buy(p.id)}>
                    {busy === p.id ? "Opening…" : "Buy"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {products.map((p) => (
        <section className={`chapter ${p.theme}`} key={`ch-${p.id}`}>
          <div className="eyebrow">{p.tag}</div>
          <h2>{p.name}</h2>
          <div className="meta">
            {p.kcal
              ? `${p.kcal} kcal · P ${p.protein} · C ${p.carbs} · F ${p.fat}`
              : "Mixed rotation · delivery included"}
          </div>
          <p className="copy">{p.desc}</p>
          <div className="price">{formatHkd(p.priceHkd)}</div>
          <button className="buy" disabled={busy === p.id} onClick={() => buy(p.id)}>
            {busy === p.id ? "Opening…" : "Buy"}
          </button>
          <div className="photo">
            <Photo src={p.image} label={p.short} />
          </div>
        </section>
      ))}

      <section className="how" id="how">
        <h2>As simple as it looks.</h2>
        <div className="steps">
          <div className="step">
            <em>01</em>
            <h3>Pick a box</h3>
            <p>Single meals or the 12-pack. Macros printed on every lid.</p>
          </div>
          <div className="step">
            <em>02</em>
            <h3>Pay on Stripe</h3>
            <p>Secure card checkout. Live keys can be added when you are ready.</p>
          </div>
          <div className="step">
            <em>03</em>
            <h3>Heat and eat</h3>
            <p>Microwave two to three minutes. Train the same evening.</p>
          </div>
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="faq-inner">
          <h2>Questions.</h2>
          <div className="qa">
            <b>Where do you deliver?</b>
            <p>Hong Kong Island, Kowloon, and selected New Territories. Ask hello@leanbox.hk for the weekly zone list.</p>
          </div>
          <div className="qa">
            <b>How do I heat a box?</b>
            <p>Peel the corner, microwave 2–3 minutes. Macros stay on the lid.</p>
          </div>
          <div className="qa">
            <b>Allergens?</b>
            <p>Weekly menu and allergen sheet by email. This store charges through Stripe Checkout.</p>
          </div>
        </div>
      </section>

      <footer>© {new Date().getFullYear()} LEANBOX · Hong Kong</footer>
    </>
  );
}
