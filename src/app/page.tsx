import Link from "next/link";
import { formatRange } from "@/lib/format";
import { dashboardService, reservationService } from "@/server/container";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ summary, usage }, upcoming] = await Promise.all([
    dashboardService.getOverview(),
    reservationService.list({ scope: "upcoming", status: "confirmed", pageSize: 5 }),
  ]);

  return (
    <>
      <h1>Dashboard</h1>
      <p className="sub">Current usage and availability across all shared resources.</p>

      <div className="grid">
        <div className="card stat"><div className="n">{summary.activeResources}</div><div className="l">Active resources</div></div>
        <div className="card stat"><div className="n">{summary.inProgressNow}</div><div className="l">In use right now</div></div>
        <div className="card stat"><div className="n">{summary.upcomingReservations}</div><div className="l">Upcoming reservations</div></div>
      </div>

      <h2>Next reservations</h2>
      {upcoming.items.length === 0 ? (
        <div className="card empty">No upcoming reservations. <Link href="/reservations/new">Create one</Link></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Resource</th><th>When</th><th>Title</th><th>Reserved by</th></tr></thead>
            <tbody>
              {upcoming.items.map((r) => (
                <tr key={r.id}>
                  <td>{r.resourceName}</td>
                  <td>{formatRange(r.startTime, r.endTime)}</td>
                  <td>{r.title}</td>
                  <td>{r.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Resource usage</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Resource</th><th>Category</th><th>Status now</th><th>Hours booked (last 30 days)</th><th>Upcoming bookings</th></tr></thead>
          <tbody>
            {usage.map((u) => (
              <tr key={u.resourceId}>
                <td>{u.name}</td>
                <td>{u.categoryName}</td>
                <td>
                  {!u.isActive ? <span className="badge gray">Inactive</span>
                    : u.inUseNow ? <span className="badge amber">In use</span>
                    : <span className="badge green">Available</span>}
                </td>
                <td>{u.hoursLast30Days.toFixed(1)} h</td>
                <td>{u.upcomingCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
