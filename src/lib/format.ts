const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Colombo";

export const APP_TIMEZONE = TZ;

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, dateStyle: "medium" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const longDateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatLongDate(d: Date = new Date()): string {
  return longDateFmt.format(d);
}

export function formatRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (dateFmt.format(s) === dateFmt.format(e)) {
    return `${dateFmt.format(s)}, ${timeFmt.format(s)} – ${timeFmt.format(e)}`;
  }
  return `${formatDateTime(startIso)} – ${formatDateTime(endIso)}`;
}

function tzOffsetMs(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(d.getTime() / 1000) * 1000;
}


export function startOfDay(d: Date = new Date()): Date {
  const offset = tzOffsetMs(d);
  const local = new Date(d.getTime() + offset);
  const midnightAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(midnightAsUtc - offset);
}

export function categoryTone(categoryId: number): number {
  return categoryId % 5;
}
