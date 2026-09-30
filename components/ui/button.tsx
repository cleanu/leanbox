import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "olive" | "outline" | "ghost" | "light" | "saffron" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-wide transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-lux)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-sage-deep text-cream hover:bg-[#4a5742] shadow-[0_12px_30px_-12px_rgba(92,107,82,0.7)]",
  olive: "bg-sage-deep text-cream hover:bg-[#4a5742]",
  outline: "border border-line-strong text-ink hover:border-ink hover:bg-ink hover:text-parchment",
  ghost: "text-ink hover:bg-parchment-2",
  light: "bg-parchment text-ink hover:bg-saffron-soft",
  saffron: "bg-wood text-night hover:bg-cream",
  danger: "bg-danger text-parchment hover:bg-[#7f2f21]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[0.95rem]",
};

export function buttonClass({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass({ variant, size, className })} {...props} />;
});

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />;
}
