"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LANG, readLang, writeLang, t } from "../../lib/i18n";

export default function CancelPage() {
  const [lang, setLang] = useState(DEFAULT_LANG);
  useEffect(() => setLang(writeLang(readLang())), []);
  const copy = t(lang);
  return (
    <main className="status-page">
      <p className="status-kicker">{copy.cancelEyebrow}</p>
      <h1>{copy.cancelTitle}</h1>
      <p>{copy.cancelCopy}</p>
      <a href="/">{copy.cancelBack}</a>
    </main>
  );
}
