"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-lux flex min-h-[70vh] flex-col items-start justify-center py-24">
      <p className="eyebrow">Error · 錯誤</p>
      <h1 className="mt-4 text-4xl">發生錯誤，請再試一次。</h1>
      <p className="mt-2 text-mute">Something went wrong. Please try again.</p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-mute">ref: {error.digest}</p> : null}
      <Button onClick={reset} className="mt-8">
        再試一次 · Retry
      </Button>
    </div>
  );
}
