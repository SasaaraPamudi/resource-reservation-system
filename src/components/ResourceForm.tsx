"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Category, Resource } from "@/types";

export default function ResourceForm({ categories, resource }: { categories: Category[]; resource?: Resource }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim() || null;
    const capacity = text("capacity");

    const body = {
      categoryId: Number(f.get("categoryId")),
      name: String(f.get("name") ?? "").trim(),
      description: text("description"),
      location: text("location"),
      capacity: capacity ? Number(capacity) : null,
    };

    setBusy(true);
    setError(null);
    try {
      await api(resource ? `/api/resources/${resource.id}` : "/api/resources", {
        method: resource ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      router.push("/resources");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {error && <div className="alert error">{error}</div>}
      <label>Name
        <input name="name" required maxLength={150} defaultValue={resource?.name} placeholder="e.g. Boardroom A" />
      </label>
      <label>Category
        <select name="categoryId" required defaultValue={resource?.categoryId ?? ""}>
          <option value="" disabled>Select a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <div className="row2">
        <label>Location <span className="hint">(optional)</span>
          <input name="location" maxLength={150} defaultValue={resource?.location ?? ""} />
        </label>
        <label>Capacity <span className="hint">(optional)</span>
          <input name="capacity" type="number" min={1} defaultValue={resource?.capacity ?? ""} />
        </label>
      </div>
      <label>Description <span className="hint">(optional)</span>
        <textarea name="description" rows={3} maxLength={1000} defaultValue={resource?.description ?? ""} />
      </label>
      <div className="actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : resource ? "Save changes" : "Create resource"}
        </button>
        <button className="btn" type="button" onClick={() => router.push("/resources")}>Cancel</button>
      </div>
    </form>
  );
}
