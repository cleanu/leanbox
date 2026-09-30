import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL_ZH, statusTone } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-mute">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({ title, action, children, className }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-[#FBF8F2]", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-sans text-sm font-medium tracking-wide text-walnut">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Stat tile: label · value · optional sub-line. */
export function StatTile({ label, value, sub, emphasis }: { label: string; value: string; sub?: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-5", emphasis ? "border-transparent bg-ink text-parchment" : "border-line bg-[#FBF8F2]")}>
      <p className={cn("text-xs", emphasis ? "text-mute-on-dark" : "text-mute")}>{label}</p>
      <p className={cn("numeral mt-2 truncate font-normal tracking-tight", emphasis ? "text-[2.6rem] leading-tight" : "text-3xl")} title={value}>
        {value}
      </p>
      {sub ? <p className={cn("mt-1.5 text-xs", emphasis ? "text-mute-on-dark" : "text-mute")}>{sub}</p> : null}
    </div>
  );
}

export function Table({ children, className, compact }: { children: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-line bg-[#FBF8F2]", className)}>
      <table className={cn("w-full text-left text-[0.82rem]", compact ? "min-w-0" : "min-w-[640px]")}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("border-b border-line bg-parchment-2/70 px-4 py-2.5 text-[0.7rem] font-medium uppercase tracking-wider text-mute", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle", className)}>{children}</td>;
}

export function FieldRow({ label, children, hint, error, htmlFor }: { label: string; children: React.ReactNode; hint?: string; error?: string; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-walnut">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}


export function AdminStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={statusTone(status)}>{STATUS_LABEL_ZH[status]}</Badge>;
}
