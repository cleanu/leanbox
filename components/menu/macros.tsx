import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Macro = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };

/** Compact macro row: 520 kcal · P 45g · C 52g · F 12g — calories largest, protein next, carbs/fat secondary. */
export function MacroRow({ meal, className, tone = "ink" }: { meal: Macro; className?: string; tone?: "ink" | "light" }) {
  const t = useTranslations("common");
  const secondary = [
    { label: t("carbs"), value: meal.carbs_g },
    { label: t("fat"), value: meal.fat_g },
  ];
  return (
    <dl className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[0.78rem]", tone === "light" ? "text-mute-on-dark" : "text-mute", className)}>
      <div className="flex items-baseline gap-1">
        <dt className="sr-only">{t("kcal")}</dt>
        <dd className={cn("numeral text-base font-extrabold", tone === "light" ? "text-parchment" : "text-ink")}>{meal.kcal}</dd>
        <span>{t("kcal")}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <dt className="sr-only">{t("protein")}</dt>
        <dd className={cn("numeral text-sm font-extrabold", tone === "light" ? "text-sage" : "text-olive-2")}>{meal.protein_g}g</dd>
        <span>{t("protein")}</span>
      </div>
      {secondary.map((i) => (
        <div key={i.label} className="flex items-baseline gap-1">
          <dt>{i.label}</dt>
          <dd className={cn("numeral font-medium", tone === "light" ? "text-parchment" : "text-ink")}>{i.value}g</dd>
        </div>
      ))}
    </dl>
  );
}

/** Proportional macro bar (energy share of protein / carbs / fat). */
export function MacroBar({ meal, className }: { meal: Macro; className?: string }) {
  const p = meal.protein_g * 4;
  const c = meal.carbs_g * 4;
  const f = meal.fat_g * 9;
  const total = p + c + f || 1;
  return (
    <div className={cn("flex h-1.5 w-full overflow-hidden rounded-full bg-parchment-3", className)} aria-hidden>
      <span className="bg-olive" style={{ width: `${(p / total) * 100}%` }} />
      <span className="bg-saffron" style={{ width: `${(c / total) * 100}%` }} />
      <span className="bg-walnut/70" style={{ width: `${(f / total) * 100}%` }} />
    </div>
  );
}
