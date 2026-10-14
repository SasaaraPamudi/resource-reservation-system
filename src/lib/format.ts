const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Colombo";

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, dateStyle: "medium" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

export function formatRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (dateFmt.format(s) === dateFmt.format(e)) {
    return `${dateFmt.format(s)}, ${timeFmt.format(s)} – ${timeFmt.format(e)}`;
  }
  return `${formatDateTime(startIso)} – ${formatDateTime(endIso)}`;
}
