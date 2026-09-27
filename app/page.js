"use client";

import { products, formatHkd } from "../lib/products";
import { LOGO_SRC, LOGO_MARK } from "../lib/logo";
import { useEffect, useState } from "react";

const HERO = [
  {
    src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=2000&q=80",
    kicker: "Hong Kong meal plans",
    title: "Fresh. Focused. Delivered.",
  },
  {
    src: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=2000&q=80",
    kicker: "High protein",
    title: "Built for the week you train.",
  },
  {
    src: "https://images.unsplash.com/photo-1532550907401-a532c00947da?auto=format&fit=crop&w=2000&q=80",
    kicker: "Ready in 3 minutes",
    title: "Macros on every lid.",
  },
];

const FEATURES = [
  { icon: "01", title: "Order by Saturday 9am", copy: "Lock next week’s boxes before the kitchen runs." },
  { icon: "02", title: "Chef-made recipes", copy: "Protein-first plates, cooked for delivery — not leftover takeout." },
  { icon: "03", title: "HK morning drop", copy: "Island, Kowloon, and selected NT. Heat when you get in." },
  { icon: "04", title: "Ready to eat · full macros", copy: "Calories, protein, carbs, fat printed on the lid." },
];

const AMBASSADORS = [
  {
    name: "LUM",
    quote:
      "Portions are right for a cut that still lets me train hard. I stop guessing dinner.",
  },
  {
    name: "HEI",
    quote:
      "Convenience is the whole point. Macros are done. I just heat and get to the gym.",
  },
  {
    name: "VANESSA",
    quote:
      "Flavour without the usual delivery grease. I stay on plan during long office weeks.",
  },
];

function Photo({ src, label }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return <div className="placeholder">{label || "Photo"}</div>;
  return <img src={src} alt={label || ""} onError={() => setFailed(true)} />;
}

export default function HomePage() {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO.length), 5200);
    return () => clearInterval(t);
  }, []);

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

  const plans = products.filter((p) => p.id !== "pack-12");
  const pack = products.find((p) => p.id === "pack-12");

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          <img src={LOGO_MARK} alt="LeanBox" />
        </a>
        <nav className="links">
          <a href="#menu">Our Menu</a>
          <a href="#plans">Meal Plans</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="top-actions">
          <a className="lang" href="#menu">ENG</a>
          <a className="order-now" href="#plans">Order Now</a>
        </div>
      </header>

      <section className="hero-banner">
        {HERO.map((h, i) => (
          <div key={h.title} className={`hero-slide ${i === slide ? "on" : ""}`}>
            <Photo src={h.src} label={h.title} />
            <div className="hero-veil" />
            <div className="hero-copy">
              <p>{h.kicker}</p>
              <h1>{h.title}</h1>
              <a className="ghost-btn" href="#plans">Order Now</a>
            </div>
          </div>
        ))}
        <div className="hero-dots">
          {HERO.map((_, i) => (
            <button key={i} className={i === slide ? "on" : ""} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Meal plan features</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title}>
              <em>{f.icon}</em>
              <h3>{f.title}</h3>
              <p>{f.copy}</p>
            </article>
          ))}
        </div>
        <p className="lede">
          LeanBox is a high-protein meal plan for Hong Kong training weeks.
          Cut, perform, or stay balanced — heat in three minutes, macros on the lid.
          <span> #EATWELL #TRAINREADY</span>
        </p>
      </section>

      <section className="checkout-meals" id="menu">
        <div className="row-head">
          <h2 className="section-title">Check out our meals</h2>
          <a className="text-link" href="#plans">Our Menu</a>
        </div>
        <div className="meal-strip">
          {plans.map((p) => (
            <button key={p.id} className="strip-card" onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}>
              <Photo src={p.image} label={p.short} />
            </button>
          ))}
        </div>
      </section>

      <section className="plans" id="plans">
        <h2 className="section-title">Featured meal plans</h2>
        {error ? <p className="err">{error}</p> : null}
        <div className="plan-grid">
          {products.map((p) => (
            <article key={p.id} className="plan-card">
              <div className="plan-photo">
                <Photo src={p.image} label={p.short} />
                <span>{p.tag}</span>
              </div>
              <div className="plan-body">
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
                <div className="macros">
                  {p.kcal
                    ? `${p.kcal} kcal · P ${p.protein} · C ${p.carbs} · F ${p.fat}`
                    : "12-meal mixed rotation"}
                </div>
                <div className="plan-row">
                  <strong>{formatHkd(p.priceHkd)}</strong>
                  <button disabled={busy === p.id} onClick={() => buy(p.id)}>
                    {busy === p.id ? "Opening…" : "Order Now"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ambassadors">
        <h2 className="section-title">Ambassadors</h2>
        <div className="quote-grid">
          {AMBASSADORS.map((a) => (
            <blockquote key={a.name}>
              <h3>{a.name}</h3>
              <p>“{a.quote}”</p>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="apart">
        <h2 className="section-title">What sets us apart</h2>
        <p>
          We believe in healthy, convenient, and smart food for people who actually train.
          LeanBox sources clean protein and vegetables, portions them for cut or performance,
          and delivers so you can eat well at home or the office.
        </p>
        {pack ? (
          <button className="order-now solid" disabled={busy === pack.id} onClick={() => buy(pack.id)}>
            {busy === pack.id ? "Opening…" : "Start with the 12-meal pack"}
          </button>
        ) : null}
      </section>

      <section className="how" id="how">
        <h2 className="section-title">How it works</h2>
        <div className="how-grid">
          <article>
            <em>01</em>
            <h3>Pick a plan</h3>
            <p>Single boxes or the athlete pack. Macros printed on every lid.</p>
          </article>
          <article>
            <em>02</em>
            <h3>Pay on Stripe</h3>
            <p>Secure checkout in HKD. Live keys can be added when you are ready.</p>
          </article>
          <article>
            <em>03</em>
            <h3>Heat and eat</h3>
            <p>Peel the corner. Microwave two to three minutes. Train the same evening.</p>
          </article>
        </div>
      </section>

      <section className="faq" id="faq">
        <h2 className="section-title">Meal plan FAQ</h2>
        {[
          ["Where do you deliver?", "Hong Kong Island, Kowloon, and selected New Territories. Write hello@leanbox.hk for the weekly zone list."],
          ["How do I heat a box?", "Peel a corner of the lid and microwave 2–3 minutes. Macros stay printed on top."],
          ["When is order cut-off?", "Order by Saturday 9am for the following training week."],
          ["Allergens?", "Weekly menu and allergen sheet by email. This store charges through Stripe Checkout."],
        ].map(([q, a], i) => (
          <button key={q} className={`qa ${openFaq === i ? "open" : ""}`} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
            <b>{q}</b>
            {openFaq === i ? <p>{a}</p> : null}
          </button>
        ))}
      </section>

      <footer>
        <div className="foot-brand">
          <img src={LOGO_SRC} alt="LeanBox" />
          <p>High-protein prepared meals for Hong Kong.</p>
        </div>
        <div>
          <h4>Our offerings</h4>
          <a href="#menu">Our Menu</a>
          <a href="#plans">Meal Plans</a>
        </div>
        <div>
          <h4>Need help?</h4>
          <a href="#faq">Meal plan FAQ</a>
          <a href="#how">How it works</a>
        </div>
        <div>
          <h4>Get in touch</h4>
          <a href="mailto:hello@leanbox.hk">hello@leanbox.hk</a>
          <p>Hong Kong</p>
        </div>
      </footer>
    </>
  );
}
