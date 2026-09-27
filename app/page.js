"use client";

import { products, formatHkd } from "../lib/products";
import { LOGO_SRC, LOGO_MARK } from "../lib/logo";
import { DEFAULT_LANG, readLang, writeLang, t, localizeProduct } from "../lib/i18n";
import { useUser } from "../lib/useUser";
import LoginModal from "../lib/LoginModal";
import { useEffect, useState } from "react";

function Photo({ src, label }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return <div className="placeholder">{label || "Photo"}</div>;
  return <img src={src} alt={label || ""} onError={() => setFailed(true)} />;
}

function LangSwitch({ lang, onChange }) {
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button className={lang === "zh" ? "on" : ""} onClick={() => onChange("zh")} type="button">
        繁
      </button>
      <span>/</span>
      <button className={lang === "en" ? "on" : ""} onClick={() => onChange("en")} type="button">
        ENG
      </button>
    </div>
  );
}

export default function HomePage() {
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, signOut } = useUser();
  const copy = t(lang);
  const hero = copy.hero;

  useEffect(() => {
    setLang(writeLang(readLang()));
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") setLoginOpen(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % hero.length), 5200);
    return () => clearInterval(timer);
  }, [hero.length]);

  function changeLang(next) {
    setLang(writeLang(next));
    setOpenFaq(0);
  }

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

  const catalog = products.map((p) => localizeProduct(p, lang));
  const plans = catalog.filter((p) => p.id !== "pack-12");
  const pack = catalog.find((p) => p.id === "pack-12");

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          <img src={LOGO_MARK} alt="LeanBox" />
        </a>
        <nav className="links">
          <a href="#menu">{copy.navMenu}</a>
          <a href="#plans">{copy.navPlans}</a>
          <a href="#how">{copy.navHow}</a>
          <a href="#faq">{copy.navFaq}</a>
        </nav>
        <div className="top-actions">
          <LangSwitch lang={lang} onChange={changeLang} />
          {user ? (
            <span className="account">
              <em>{user.email}</em>
              <button type="button" className="text-link" onClick={signOut}>{copy.authLogout}</button>
            </span>
          ) : (
            <button type="button" className="text-link" onClick={() => setLoginOpen(true)}>
              {copy.authLogin}
            </button>
          )}
          <a className="order-now" href="#plans">{copy.orderNow}</a>
        </div>
      </header>

      <section className="hero-banner">
        {hero.map((h, i) => (
          <div key={`${h.title}-${i}`} className={`hero-slide ${i === slide ? "on" : ""}`}>
            <Photo src={h.src} label={h.title} />
            <div className="hero-veil" />
            <div className="hero-copy">
              <p>{h.kicker}</p>
              <h1>{h.title}</h1>
              <a className="ghost-btn" href="#plans">{copy.orderNow}</a>
            </div>
          </div>
        ))}
        <div className="hero-dots">
          {hero.map((_, i) => (
            <button key={i} className={i === slide ? "on" : ""} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">{copy.featuresTitle}</h2>
        <div className="feature-grid">
          {copy.features.map((f) => (
            <article key={f.title}>
              <em>{f.icon}</em>
              <h3>{f.title}</h3>
              <p>{f.copy}</p>
            </article>
          ))}
        </div>
        <p className="lede">
          {copy.lede}
          <span>{copy.hashtags}</span>
        </p>
      </section>

      <section className="checkout-meals" id="menu">
        <div className="row-head">
          <h2 className="section-title">{copy.mealsTitle}</h2>
          <a className="text-link" href="#plans">{copy.navMenu}</a>
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
        <h2 className="section-title">{copy.plansTitle}</h2>
        {error ? <p className="err">{error}</p> : null}
        <div className="plan-grid">
          {catalog.map((p) => (
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
                    : copy.packMacros}
                </div>
                <div className="plan-row">
                  <strong>{formatHkd(p.priceHkd)}</strong>
                  <button disabled={busy === p.id} onClick={() => buy(p.id)}>
                    {busy === p.id ? copy.opening : copy.orderNow}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ambassadors">
        <h2 className="section-title">{copy.ambassadorsTitle}</h2>
        <div className="quote-grid">
          {copy.ambassadors.map((a) => (
            <blockquote key={a.name}>
              <h3>{a.name}</h3>
              <p>{lang === "zh" ? `「${a.quote}」` : `“${a.quote}”`}</p>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="apart">
        <h2 className="section-title">{copy.apartTitle}</h2>
        <p>{copy.apartCopy}</p>
        {pack ? (
          <button className="order-now solid" disabled={busy === pack.id} onClick={() => buy(pack.id)}>
            {busy === pack.id ? copy.opening : copy.startPack}
          </button>
        ) : null}
      </section>

      <section className="how" id="how">
        <h2 className="section-title">{copy.howTitle}</h2>
        <div className="how-grid">
          {copy.how.map((step) => (
            <article key={step.title}>
              <em>{step.icon}</em>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="faq" id="faq">
        <h2 className="section-title">{copy.faqTitle}</h2>
        {copy.faq.map(([q, a], i) => (
          <button key={q} className={`qa ${openFaq === i ? "open" : ""}`} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
            <b>{q}</b>
            {openFaq === i ? <p>{a}</p> : null}
          </button>
        ))}
      </section>

      <footer>
        <div className="foot-brand">
          <img src={LOGO_SRC} alt="LeanBox" />
          <p>{copy.footTag}</p>
        </div>
        <div>
          <h4>{copy.footOffer}</h4>
          <a href="#menu">{copy.navMenu}</a>
          <a href="#plans">{copy.navPlans}</a>
        </div>
        <div>
          <h4>{copy.footHelp}</h4>
          <a href="#faq">{copy.faqTitle}</a>
          <a href="#how">{copy.navHow}</a>
        </div>
        <div>
          <h4>{copy.footContact}</h4>
          <a href="mailto:hello@leanbox.hk">hello@leanbox.hk</a>
          <p>{copy.footHk}</p>
        </div>
      </footer>
      {loginOpen && !user ? (
        <LoginModal copy={copy} onClose={() => setLoginOpen(false)} />
      ) : null}
    </>
  );
}
