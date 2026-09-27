import "./globals.css";

export const metadata = {
  title: "LeanBox — The meal. Rebuilt.",
  description: "High-protein prepared meals for Hong Kong athletes. Cut, Perform, and Balance boxes.",
  icons: { icon: "/logo-mark.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
