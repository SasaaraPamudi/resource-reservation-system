"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Availability, Resource } from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

interface Props {
  resources: Resource[];
  initialResourceId?: number;
}

export default function ReservationForm({ resources, initialResourceId }: Props) {
  const router = useRouter();
  const [resourceId, setResourceId] = useState<string>(initialResourceId ? String(initialResourceId) : "");
  const [date, setDate] = useState(toDateInput(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userTeam, setUserTeam] = useState("");

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Remember who is booking (convenience only, never trusted by the server).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("reserver") ?? "null");
      if (saved) {
        setUserName(saved.userName ?? "");
        setUserEmail(saved.userEmail ?? "");
        setUserTeam(saved.userTeam ?? "");
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Show the chosen day's bookings and free slots.
  useEffect(() => {
    if (!resourceId || !date) {
      setAvailability(null);
      return;
    }
    const from = new Date(`${date}T00:00`);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    let cancelled = false;
    api<Availability>(
      `/api/resources/${resourceId}/availability?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
    )
      .then((a) => !cancelled && setAvailability(a))
      .catch(() => !cancelled && setAvailability(null));
    return () => {
      cancelled = true;
    };
  }, [resourceId, date, refreshKey]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please choose a valid date and time.");
      return;
    }

    setBusy(true);
    try {
      await api("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          resourceId: Number(resourceId),
          title,
          notes: notes.trim() || null,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          userName,
          userEmail,
          userTeam: userTeam.trim() || null,
        }),
      });
      try {
        localStorage.setItem("reserver", JSON.stringify({ userName, userEmail, userTeam }));
      } catch {
        /* ignore */
      }
      router.push("/reservations");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Refresh the slot list so the user sees what was taken.
      setRefreshKey((k) => k + 1);
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {error && <div className="alert error">{error}</div>}

      <label>Resource
        <select required value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
          <option value="" disabled>Select a resource</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.categoryName}{r.location ? ` (${r.location})` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="row3">
        <label>Date
          <input type="date" required value={date} min={toDateInput(new Date())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>Start
          <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label>End
          <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>

      {resourceId && availability && (
        <div className="card">
          <strong>Bookings on this day</strong>
          <div className="slots">
            {availability.reservations.length === 0 && <span className="muted">Nothing booked yet.</span>}
            {availability.reservations.map((r) => (
              <span key={r.id} className="slot busy">{timeLabel(r.startTime)}–{timeLabel(r.endTime)} {r.title}</span>
            ))}
          </div>
          <div style={{ marginTop: 10 }}><strong>Free slots</strong></div>
          <div className="slots">
            {availability.freeSlots.length === 0 && <span className="muted">No free time left.</span>}
            {availability.freeSlots.map((s, i) => (
              <span key={i} className="slot free">{timeLabel(s.start)}–{timeLabel(s.end)}</span>
            ))}
          </div>
        </div>
      )}

      <label>Title
        <input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint planning" />
      </label>
      <label>Notes <span className="hint">(optional)</span>
        <textarea rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="row3">
        <label>Your name
          <input required maxLength={100} value={userName} onChange={(e) => setUserName(e.target.value)} />
        </label>
        <label>Email
          <input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
        </label>
        <label>Team <span className="hint">(optional)</span>
          <input maxLength={100} value={userTeam} onChange={(e) => setUserTeam(e.target.value)} />
        </label>
      </div>

      <div className="actions">
        <button className="btn primary" type="submit" disabled={busy || !resourceId}>
          {busy ? "Booking…" : "Confirm reservation"}
        </button>
        <button className="btn" type="button" onClick={() => router.push("/reservations")}>Cancel</button>
      </div>
    </form>
  );
}
