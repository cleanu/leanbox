"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatHKD } from "@/lib/money";

/**
 * Chart palette (validated with the dataviz validator against surface #FBF8F2):
 *   series 1 — sales / revenue  #2E7D52  (brand olive, one chroma step up)
 *   series 2 — COGS             #B08408  (brand saffron, one step darker)
 * Text always uses ink/mute tokens, never the series colour.
 */
export const CHART = {
  sales: "#2E7D52",
  cogs: "#B08408",
  grid: "rgba(44,33,24,0.10)",
  axis: "#685E53",
  surface: "#FBF8F2",
};

const compactHKD = (cents: number) => {
  const v = cents / 100;
  if (Math.abs(v) >= 1_000_000) return `HK$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `HK$${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
  return `HK$${Math.round(v)}`;
};

function TooltipCard({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs shadow-[0_12px_30px_-16px_rgba(22,19,16,0.4)]">
      <p className="mb-1.5 text-mute">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="numeral text-sm font-medium text-ink">{formatHKD(Number(p.value))}</span>
          <span className="text-mute">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

/** Daily net revenue — single series, so no legend (the panel title names it). */
export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: d.date.slice(5).replace("-", "/") }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: CHART.grid }} tick={{ fontSize: 11, fill: CHART.axis }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tickFormatter={compactHKD} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} width={64} />
          <Tooltip content={(p) => <TooltipCard {...(p as TooltipContentProps<number, string>)} />} cursor={{ fill: "rgba(44,33,24,0.05)" }} />
          <Bar dataKey="revenue" name="淨營業額" fill={CHART.sales} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Sales vs COGS by item — two series: legend + tooltip, table view lives next to it. */
export function SalesCogsChart({ data }: { data: { name: string; sales: number; cogs: number }[] }) {
  const height = Math.max(220, data.length * 44 + 60);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" tickFormatter={compactHKD} tickLine={false} axisLine={{ stroke: CHART.grid }} tick={{ fontSize: 11, fill: CHART.axis }} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#161310" }} width={150} />
          <Tooltip content={(p) => <TooltipCard {...(p as TooltipContentProps<number, string>)} />} cursor={{ fill: "rgba(44,33,24,0.05)" }} />
          <Legend verticalAlign="top" align="right" itemSorter={null} iconType="rect" iconSize={10} wrapperStyle={{ fontSize: 12, color: "#685E53", paddingBottom: 8 }} />
          <Bar dataKey="sales" name="銷售額" fill={CHART.sales} radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
          <Bar dataKey="cogs" name="成本 (COGS)" fill={CHART.cogs} radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
