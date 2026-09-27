export default function SuccessPage() {
  return (
    <main className="wrap" style={{ padding: "80px 20px" }}>
      <h1>Paid. Box is on the list.</h1>
      <p className="lead">Stripe confirmed the checkout. We will confirm delivery window by email.</p>
      <p><a className="btn primary" href="/">Back to menu</a></p>
    </main>
  );
}
