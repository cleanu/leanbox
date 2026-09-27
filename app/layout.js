import "./globals.css";

export const metadata = {
  title: "LEANBOX — Chef meals for training weeks",
  description:
    "High-protein prepared meals for Hong Kong athletes. Order Cut, Perform, or Balance boxes. Pay with Stripe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
