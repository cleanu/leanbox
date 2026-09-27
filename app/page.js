"use client";

import { products, formatHkd } from "../lib/products";
import { useState } from "react";

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
    <div className="wrap">
      <header>
        <div className="brand">LEANBOX</div>
        <nav>
          <a href="#menu">Menu</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <h1>Meals that keep up with training.</h1>
          <p className="lead">
            High-protein boxes for Hong Kong athletes — cut, perform, or stay
            balanced. Heat in 3 minutes. Pay with Stripe.
          </p>
          <div className="cta">
            <a className="btn primary" href="#menu">Order a box</a>
            <a className="btn ghost" href="#how">See the plan</a>
          </div>
        </div>
        <div className="stat">
          <b>30–48g</b>
          protein per meal
          <p className="lead" style={{ marginTop: 16 }}>
            Built for gym weeks, not office salad. Macros on the lid. Delivery
            across HK Island, Kowloon, and selected NT.
          </p>
        </div>
      </section>

      <h2 id="menu">Menu</h2>
      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
      <div className="grid">
        {products.map((p) => (
          <article className="card" key={p.id}>
            <div className="tag">{p.tag}</div>
            <h3>{p.name}</h3>
            <p className="macros">
              {p.kcal
                ? `${p.kcal} kcal · P ${p.protein} · C ${p.carbs} · F ${p.fat}`
                : "Mixed rotation · delivery included"}
            </p>
            <p className="lead">{p.desc}</p>
            <div className="price">{formatHkd(p.priceHkd)}</div>
            <button className="primary" disabled={busy === p.id} onClick={() => buy(p.id)}>
              {busy === p.id ? "Opening Stripe…" : "Buy with Stripe"}
            </button>
          </article>
        ))}
      </div>

      <h2 id="how">How it works</h2>
      <div className="grid">
        <div className="card"><h3>1. Pick a box</h3><p className="lead">Single meals or the 12-pack. Macros printed on every lid.</p></div>
        <div className="card"><h3>2. Pay on Stripe</h3><p className="lead">Secure card checkout. Test mode until you add live keys.</p></div>
        <div className="card"><h3>3. Heat and eat</h3><p className="lead">Microwave 2–3 minutes. Train the same evening.</p></div>
      </div>

      <h2 id="faq">FAQ</h2>
      <p className="lead">Allergen list and weekly menu: hello@leanbox.hk. This demo store charges via Stripe Checkout.</p>
      <footer>© {new Date().getFullYear()} LEANBOX · Nutrition meals · Hong Kong</footer>
    </div>
  );
}
