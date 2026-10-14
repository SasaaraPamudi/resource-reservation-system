import Link from "next/link";
import DayTimeline from "@/components/DayTimeline";
import { categoryTone, formatLongDate, formatRange, startOfDay } from "@/lib/format";
import { dashboardService, reservationService, resourceService } from "@/server/container";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dayStart = startOfDay();
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000);

  const [{ summary, usage }, next, today, resources] = await Promise.all([
    dashboardService.getOverview(),
    reservationService.list({ scope: "upcoming", status: "confirmed", pageSize: 6 }),
    reservationService.list({ status: "confirmed", from: dayStart, to: dayEnd, pageSize: 100 }),
    resourceService.list(),
  ]);

  const toneOf = new Map(resources.map((r) => [r.id, categoryTone(r.categoryId)]));
  const maxHours = Math.max(...usage.map((u) => u.hoursLast30Days), 1);
  const now = Date.now();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Today</h1>
          <p className="sub">{formatLongDate()}</p>
        </div>
        <div className="summary">
          <div><strong>{summary.inProgressNow}</strong><span>in use now</span></div>
          <div><strong>{summary.upcomingReservations}</strong><span>coming up</span></div>
          <div><strong>{summary.activeResources}</strong><span>resources</span></div>
        </div>
      </div>

      <section className="card panel">
        <div className="panel-head">
          <h2>Schedule</h2>
          <span className="muted">
            {today.total === 0 ? "Nothing booked today. Every resource is free." : `${today.total} booking${today.total === 1 ? "" : "s"} today`}
          </span>
        </div>
        {resources.length === 0 ? (
          <div className="empty">No resources yet. <Link href="/resources/new">Add your first resource</Link></div>
        ) : (
          <DayTimeline resources={resources} reservations={today.items} dayStart={dayStart} />
        )}
      </section>

      <div className="split">
        <section className="card panel">
          <div className="panel-head">
            <h2>Up next</h2>
            <Link href="/reservations">View all</Link>
          </div>
          {next.items.length === 0 ? (
            <div className="empty">No upcoming reservations. <Link href="/reservations/new">Book a resource</Link></div>
          ) : (
            <ul className="feed">
              {next.items.map((r) => {
                const live = new Date(r.startTime).getTime() <= now;
                return (
                  <li key={r.id} className={`tone-${toneOf.get(r.resourceId) ?? 0}`}>
                    <i className="dot" />
                    <div>
                      <strong>{r.title}</strong>
                      <span className="muted">{r.resourceName}, {r.userName}</span>
                      <span className="muted">{formatRange(r.startTime, r.endTime)}</span>
                    </div>
                    {live && <span className="badge amber">In progress</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <h2>Usage</h2>
            <span className="muted">Hours booked, last 30 days</span>
          </div>
          <ul className="usage">
            {usage.map((u) => (
              <li key={u.resourceId} className={u.isActive ? "" : "off"}>
                <div className="usage-top">
                  <strong>{u.name}</strong>
                  <span>{u.hoursLast30Days.toFixed(1)} h</span>
                </div>
                <div className="meter"><i style={{ width: `${(u.hoursLast30Days / maxHours) * 100}%` }} /></div>
                <span className="muted">
                  {!u.isActive ? "Inactive" : u.inUseNow ? "In use now" : "Free now"}, {u.upcomingCount} upcoming
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
