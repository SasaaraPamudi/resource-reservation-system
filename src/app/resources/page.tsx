import Link from "next/link";
import ToggleActiveButton from "@/components/ToggleActiveButton";
import { categoryTone } from "@/lib/format";
import { resourceService } from "@/server/container";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await resourceService.list({ includeInactive: true });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Resources</h1>
          <p className="sub">Everything your team shares, from meeting rooms to the company van. Pick one to book it.</p>
        </div>
        <Link href="/resources/new" className="btn primary">Add resource</Link>
      </div>

      {resources.length === 0 ? (
        <div className="card empty">No resources yet. <Link href="/resources/new">Add the first one</Link>.</div>
      ) : (
        <div className="res-grid">
          {resources.map((r) => (
            <article key={r.id} className={`card res-card tone-${categoryTone(r.categoryId)}${r.isActive ? "" : " off"}`}>
              <div className="res-top">
                <span className="chip">{r.categoryName}</span>
                {r.isActive ? <span className="badge green">Active</span> : <span className="badge gray">Inactive</span>}
              </div>
              <h3>{r.name}</h3>
              <p className="muted res-desc">{r.description ?? "No description"}</p>
              <dl className="res-meta">
                <div><dt>Location</dt><dd>{r.location ?? "Not set"}</dd></div>
                <div><dt>Capacity</dt><dd>{r.capacity ?? "Not set"}</dd></div>
              </dl>
              <div className="actions">
                {r.isActive && <Link className="btn small primary" href={`/reservations/new?resourceId=${r.id}`}>Book</Link>}
                <Link className="btn small" href={`/resources/${r.id}/edit`}>Edit</Link>
                <ToggleActiveButton id={r.id} isActive={r.isActive} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
