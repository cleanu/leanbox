import "./globals.css";

export const metadata = {
  title: "LEANBOX — The meal. Rebuilt.",
  description: "High-protein prepared meals for Hong Kong athletes. Cut, Perform, and Balance boxes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
