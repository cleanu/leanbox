import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default", className }: { children: React.ReactNode; tone?: "default" | "olive" | "saffron" | "ink" | "danger" | "muted"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide",
        tone === "default" && "border border-line-strong text-walnut",
        tone === "olive" && "bg-olive-soft text-olive-2",
        tone === "saffron" && "bg-saffron-soft text-walnut",
        tone === "ink" && "bg-ink text-parchment",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "muted" && "bg-parchment-2 text-mute",
        className,
      )}
    >
      {children}
    </span>
  );
}
