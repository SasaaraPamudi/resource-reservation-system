import Link from "next/link";
import ToggleActiveButton from "@/components/ToggleActiveButton";
import { resourceService } from "@/server/container";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await resourceService.list({ includeInactive: true });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Resources</h1>
          <p className="sub">Rooms, equipment and vehicles that can be reserved.</p>
        </div>
        <Link href="/resources/new" className="btn primary">+ Add resource</Link>
      </div>

      {resources.length === 0 ? (
        <div className="card empty">No resources yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Location</th><th>Capacity</th><th>Status</th><th /></tr></thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong>{r.description && <div className="muted">{r.description}</div>}</td>
                  <td>{r.categoryName}</td>
                  <td>{r.location ?? "—"}</td>
                  <td>{r.capacity ?? "—"}</td>
                  <td>{r.isActive ? <span className="badge green">Active</span> : <span className="badge gray">Inactive</span>}</td>
                  <td>
                    <div className="actions">
                      {r.isActive && <Link className="btn small primary" href={`/reservations/new?resourceId=${r.id}`}>Book</Link>}
                      <Link className="btn small" href={`/resources/${r.id}/edit`}>Edit</Link>
                      <ToggleActiveButton id={r.id} isActive={r.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
