export default function SuccessPage() {
  return (
    <main className="hero" style={{ minHeight: "100vh" }}>
      <div className="eyebrow">Checkout</div>
      <h1>Paid.</h1>
      <p className="sub">Stripe confirmed the order. We will email the delivery window.</p>
      <div className="hero-actions">
        <a className="link" href="/">Back to Leanbox →</a>
      </div>
    </main>
  );
}
