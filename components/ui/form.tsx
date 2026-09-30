"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Label({ htmlFor, children, hint, optional }: { htmlFor: string; children: React.ReactNode; hint?: React.ReactNode; optional?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between gap-3 text-[0.82rem] font-medium text-walnut">
      <span>
        {children}
        {optional ? <span className="ml-1.5 font-normal text-mute">（{optional}）</span> : null}
      </span>
      {hint ? <span className="text-xs font-normal text-mute">{hint}</span> : null}
    </label>
  );
}

export function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[0.8rem] text-danger">
      {children}
    </p>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        tone === "error" && "border-danger/30 bg-danger-soft text-danger",
        tone === "success" && "border-olive/25 bg-olive-soft text-olive-2",
        tone === "info" && "border-saffron/30 bg-saffron-soft/60 text-walnut",
      )}
    >
      {children}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant = "primary",
  size = "lg",
  disabled,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  className?: string;
  variant?: "primary" | "olive" | "outline" | "saffron" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** For forms submitted via onSubmit (no `action` prop), pass the transition's pending flag. */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Submit a server action without React's automatic post-action form reset,
 * so a validation error doesn't wipe what the user typed.
 */
export function submitWithoutReset(dispatch: (fd: FormData) => void, startTransition: (cb: () => void) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
}
