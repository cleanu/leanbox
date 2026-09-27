import "./globals.css";

export const metadata = {
  title: "LeanBox — High-protein meal plans in Hong Kong",
  description:
    "Chef-portioned high-protein boxes for cut, perform, and everyday balance. Delivered across Hong Kong.",
  icons: { icon: "/logo-mark.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Josefin+Sans:wght@400;600&family=Montserrat:wght@300;400;500;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
