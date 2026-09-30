import { shopConfig } from "./config";

/**
 * Delivery weeks run Monday → Sunday (Hong Kong time) and are identified by
 * their ISO week, e.g. "2026-W41". Orders placed before a week's cutoff
 * (default: the Sunday 23:59 HKT right before it starts) join that week.
 *
 * All maths happens on "HKT wall-clock" timestamps: UTC ms shifted by +8h and
 * read back with getUTC* getters. Hong Kong has no daylight saving time.
 */
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const OFFSET = shopConfig.cutoff.utcOffsetHours * HOUR;

export type DeliveryWeek = {
  /** ISO week id, e.g. 2026-W41 */
  id: string;
  /** Monday 00:00 HKT as ISO date string YYYY-MM-DD */
  startDate: string;
  /** Sunday as YYYY-MM-DD */
  endDate: string;
  /** Cutoff instant (UTC ISO string) */
  cutoffAt: string;
};

function toWall(date: Date) {
  return date.getTime() + OFFSET;
}

function fromWall(wallMs: number) {
  return new Date(wallMs - OFFSET);
}

function ymd(wallMs: number) {
  return new Date(wallMs).toISOString().slice(0, 10);
}

function isoWeekId(mondayWallMs: number): string {
  // ISO week-year is the year of the week's Thursday.
  const thursday = new Date(mondayWallMs + 3 * DAY);
  const year = thursday.getUTCFullYear();
  const jan4 = Date.UTC(year, 0, 4);
  const jan4Dow = (new Date(jan4).getUTCDay() + 6) % 7; // Mon=0
  const week1Monday = jan4 - jan4Dow * DAY;
  const week = Math.floor((mondayWallMs - week1Monday) / (7 * DAY)) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function mondayOf(wallMs: number) {
  const d = new Date(wallMs);
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  return midnight - dow * DAY;
}

/** Cutoff (wall ms) for the delivery week starting at mondayWallMs. */
function cutoffWall(mondayWallMs: number) {
  const { weekday, hour, minute } = shopConfig.cutoff;
  const offsetFromPrevMonday = ((weekday + 6) % 7) * DAY; // Mon=0 … Sun=6
  return mondayWallMs - 7 * DAY + offsetFromPrevMonday + hour * HOUR + minute * 60_000 + 59_999;
}

function describe(mondayWallMs: number): DeliveryWeek {
  return {
    id: isoWeekId(mondayWallMs),
    startDate: ymd(mondayWallMs),
    endDate: ymd(mondayWallMs + 6 * DAY),
    cutoffAt: fromWall(cutoffWall(mondayWallMs)).toISOString(),
  };
}

/** The next `count` delivery weeks that are still open for orders. */
export function openDeliveryWeeks(now: Date = new Date(), count = 2): DeliveryWeek[] {
  const wallNow = toWall(now);
  const weeks: DeliveryWeek[] = [];
  let monday = mondayOf(wallNow);
  for (let i = 0; i < 6 && weeks.length < count; i++, monday += 7 * DAY) {
    if (wallNow <= cutoffWall(monday)) weeks.push(describe(monday));
  }
  return weeks;
}

/** ISO week id of the Hong Kong week containing `now`. */
export function currentWeekId(now: Date = new Date()): string {
  return isoWeekId(mondayOf(toWall(now)));
}

export function isWeekOpen(weekId: string, now: Date = new Date()): boolean {
  return openDeliveryWeeks(now, 2).some((w) => w.id === weekId);
}

export function weekById(weekId: string): DeliveryWeek | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = Date.UTC(year, 0, 4);
  const jan4Dow = (new Date(jan4).getUTCDay() + 6) % 7;
  const monday = jan4 - jan4Dow * DAY + (week - 1) * 7 * DAY;
  return describe(monday);
}

/** Next cutoff instant from now. */
export function nextCutoff(now: Date = new Date()): Date {
  const [first] = openDeliveryWeeks(now, 1);
  return new Date(first.cutoffAt);
}

const WEEKDAYS_ZH = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function cutoffLabel(locale: string): string {
  const { weekday, hour, minute } = shopConfig.cutoff;
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return locale === "en" ? `${WEEKDAYS_EN[weekday]} ${time} HKT` : `${WEEKDAYS_ZH[weekday]} ${time}`;
}

/** "10月5日 – 10月11日" / "5 Oct – 11 Oct" */
export function formatWeekRange(week: Pick<DeliveryWeek, "startDate" | "endDate">, locale: string): string {
  const fmt = (s: string) => {
    const [, mm, dd] = s.split("-").map(Number);
    if (locale === "en") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${dd} ${months[mm - 1]}`;
    }
    return `${mm}月${dd}日`;
  };
  return `${fmt(week.startDate)} – ${fmt(week.endDate)}`;
}

export function formatWeekId(weekId: string | null | undefined, locale: string): string {
  if (!weekId) return "—";
  const w = weekById(weekId);
  return w ? formatWeekRange(w, locale) : weekId;
}

/** Format a timestamp in Hong Kong time. */
export function formatHKT(
  iso: string | Date | null | undefined,
  locale: string,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale === "en" ? "en-HK" : "zh-HK", {
    timeZone: "Asia/Hong_Kong",
    ...opts,
  }).format(d);
}
