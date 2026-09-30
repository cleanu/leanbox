"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { resendVerificationAction } from "@/actions/auth";
import { FormAlert } from "@/components/ui/form";

export function ResendButton({ email, next }: { email: string; next?: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending || cooldown > 0}
        onClick={() =>
          start(async () => {
            const res = await resendVerificationAction(email, next);
            if (res.ok) {
              setMessage({ tone: "success", text: t("resent") });
              setCooldown(60);
            } else {
              setMessage({ tone: "error", text: t(`errors.${res.error ?? "generic"}`) });
            }
          })
        }
        className="link-underline text-sm font-medium text-olive disabled:text-mute"
      >
        {pending ? t("submitting") : cooldown > 0 ? `${t("resend")} (${cooldown}s)` : t("resend")}
      </button>
      {message ? <FormAlert tone={message.tone}>{message.text}</FormAlert> : null}
    </div>
  );
}
