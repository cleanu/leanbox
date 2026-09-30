"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement> & { toggleLabel?: string }) {
  const [show, setShow] = useState(false);
  const { toggleLabel = "Show password", className, ...rest } = props;
  return (
    <div className="relative">
      <input {...rest} type={show ? "text" : "password"} className={`field pr-12 ${className ?? ""}`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-full text-mute transition hover:bg-parchment-2 hover:text-ink"
        aria-label={toggleLabel}
        aria-pressed={show}
      >
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
