import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      aria-hidden
      width={220}
      height={162}
      priority
      className={cn("h-8 w-auto shrink-0", className)}
    />
  );
}

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "parchment" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", tone === "ink" ? "text-ink" : "text-parchment", className)}>
      <LogoMark />
      <span className="font-serif text-[1.35rem] font-extrabold leading-none tracking-[-0.03em]">
        Lean<span className={tone === "ink" ? "text-sage-deep" : "text-sage"}>Box</span>
      </span>
    </span>
  );
}
