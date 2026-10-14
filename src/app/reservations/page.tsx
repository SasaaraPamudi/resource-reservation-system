import Link from "next/link";
import CancelButton from "@/components/CancelButton";
import { formatRange } from "@/lib/format";
import { reservationService, resourceService } from "@/server/container";
import type { ReservationScope, ReservationStatus } from "@/types";

export const dynamic = "force-dynamic";

type SP = { resourceId?: string; status?: string; scope?: string; page?: string };

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const scope = (["upcoming", "past", "all"].includes(sp.scope ?? "") ? sp.scope : "upcoming") as ReservationScope;
  const status = (sp.status === "cancelled" ? "cancelled" : sp.status === "all" ? undefined : "confirmed") as
    | ReservationStatus
    | undefined;
  const resourceId = Number(sp.resourceId) || undefined;
  const page = Math.max(Number(sp.page) || 1, 1);
  const pageSize = 15;

  const [{ items, total }, resources] = await Promise.all([
    reservationService.list({ resourceId, status, scope, page, pageSize }),
    resourceService.list({ includeInactive: true }),
  ]);
  const pages = Math.max(Math.ceil(total / pageSize), 1);
  const qs = (p: number) => {
    const q = new URLSearchParams();
    if (sp.resourceId) q.set("resourceId", sp.resourceId);
    if (sp.status) q.set("status", sp.status);
    if (sp.scope) q.set("scope", sp.scope);
    q.set("page", String(p));
    return `/reservations?${q.toString()}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reservations</h1>
          <p className="sub">{total} reservation{total === 1 ? "" : "s"} found.</p>
        </div>
        <Link href="/reservations/new" className="btn primary">+ New reservation</Link>
      </div>

      <form className="filters" method="get">
        <label>Resource
          <select name="resourceId" defaultValue={sp.resourceId ?? ""}>
            <option value="">All resources</option>
            {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label>When
          <select name="scope" defaultValue={scope}>
            <option value="upcoming">Upcoming / ongoing</option>
            <option value="past">Past</option>
            <option value="all">All</option>
          </select>
        </label>
        <label>Status
          <select name="status" defaultValue={sp.status ?? "confirmed"}>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All</option>
          </select>
        </label>
        <button className="btn" type="submit">Apply</button>
      </form>

      {items.length === 0 ? (
        <div className="card empty">No reservations match these filters.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Resource</th><th>When</th><th>Title</th><th>Reserved by</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((r) => {
                const ended = new Date(r.endTime) <= new Date();
                return (
                  <tr key={r.id}>
                    <td>{r.resourceName}</td>
                    <td>{formatRange(r.startTime, r.endTime)}</td>
                    <td>{r.title}{r.notes && <div className="muted">{r.notes}</div>}</td>
                    <td>{r.userName}<div className="muted">{r.userTeam ?? r.userEmail}</div></td>
                    <td>{r.status === "cancelled" ? <span className="badge red">Cancelled</span> : ended ? <span className="badge gray">Completed</span> : <span className="badge green">Confirmed</span>}</td>
                    <td>{r.status === "confirmed" && !ended && <CancelButton id={r.id} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="pager">
          {page > 1 && <Link className="btn small" href={qs(page - 1)}>← Previous</Link>}
          <span className="muted">Page {page} of {pages}</span>
          {page < pages && <Link className="btn small" href={qs(page + 1)}>Next →</Link>}
        </div>
      )}
    </>
  );
}
