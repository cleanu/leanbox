"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LANG, readLang, writeLang, t } from "../../lib/i18n";

export default function SuccessPage() {
  const [lang, setLang] = useState(DEFAULT_LANG);
  useEffect(() => setLang(writeLang(readLang())), []);
  const copy = t(lang);
  return (
    <main className="status-page">
      <p className="status-kicker">{copy.successEyebrow}</p>
      <h1>{copy.successTitle}</h1>
      <p>{copy.successCopy}</p>
      <a href="/">{copy.successBack}</a>
    </main>
  );
}
