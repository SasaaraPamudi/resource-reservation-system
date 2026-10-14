import { categoryTone, formatTime } from "@/lib/format";
import type { Reservation, Resource } from "@/types";

const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = END_HOUR - START_HOUR;
const HOUR_MS = 3600_000;

interface Props {
  resources: Resource[];
  reservations: Reservation[];
  dayStart: Date;
}

export default function DayTimeline({ resources, reservations, dayStart }: Props) {
  const winStart = dayStart.getTime() + START_HOUR * HOUR_MS;
  const winLength = HOURS * HOUR_MS;
  const pct = (t: number) => Math.min(Math.max(((t - winStart) / winLength) * 100, 0), 100);
  const now = Date.now();
  const nowPct = now >= winStart && now <= winStart + winLength ? pct(now) : null;

  const byResource = new Map<number, Reservation[]>();
  for (const r of reservations) {
    const list = byResource.get(r.resourceId) ?? [];
    list.push(r);
    byResource.set(r.resourceId, list);
  }

  return (
    <div className="tl-scroll">
      <div className="tl">
        <div className="tl-row tl-axis">
          <div />
          <div className="tl-hours">
            {Array.from({ length: HOURS }, (_, i) => (
              <span key={i}>{String(START_HOUR + i).padStart(2, "0")}:00</span>
            ))}
          </div>
        </div>

        {resources.map((res) => {
          const bookings = byResource.get(res.id) ?? [];
          return (
            <div className={`tl-row tone-${categoryTone(res.categoryId)}`} key={res.id}>
              <div className="tl-label">
                <strong>{res.name}</strong>
                <span>{res.location ?? res.categoryName}</span>
              </div>
              <div className="tl-track">
                {nowPct !== null && <i className="tl-now" style={{ left: `${nowPct}%` }} />}
                {bookings.map((b) => {
                  const left = pct(new Date(b.startTime).getTime());
                  const right = pct(new Date(b.endTime).getTime());
                  if (right <= left) return null;
                  const live = new Date(b.startTime).getTime() <= now && new Date(b.endTime).getTime() > now;
                  return (
                    <div
                      key={b.id}
                      className={`tl-bar${live ? " live" : ""}`}
                      style={{ left: `${left}%`, width: `${right - left}%` }}
                      title={`${b.title} (${b.userName}), ${formatTime(b.startTime)}–${formatTime(b.endTime)}`}
                    >
                      <span>{b.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
