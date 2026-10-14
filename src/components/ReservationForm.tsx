"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Availability, Resource } from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeLabel = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const WIN_START = 7;
const WIN_END = 21;
const WIN_HOURS = WIN_END - WIN_START;

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

      {resourceId && availability && (() => {
        const dayStart = new Date(`${date}T00:00`).getTime();
        const pct = (t: number) =>
          Math.min(Math.max(((t - dayStart) / 3600000 - WIN_START) / WIN_HOURS, 0), 1) * 100;
        const selStart = new Date(`${date}T${startTime}`).getTime();
        const selEnd = new Date(`${date}T${endTime}`).getTime();
        const hasSel = !Number.isNaN(selStart) && !Number.isNaN(selEnd) && selEnd > selStart;
        const clashes = hasSel
          ? availability.reservations.filter(
              (r) => selStart < new Date(r.endTime).getTime() && selEnd > new Date(r.startTime).getTime(),
            )
          : [];
        const QUARTER = 15 * 60000;
        const winStartMs = dayStart + WIN_START * 3600000;
        const winEndMs = dayStart + WIN_END * 3600000;
        const slots = availability.freeSlots
          .map((sl) => ({
            start: Math.ceil(Math.max(new Date(sl.start).getTime(), winStartMs) / QUARTER) * QUARTER,
            end: Math.min(new Date(sl.end).getTime(), winEndMs),
          }))
          .filter((sl) => sl.end - sl.start >= QUARTER);
        const pickSlot = (sl: { start: number; end: number }) => {
          const end = Math.min(sl.end, sl.start + 3600000);
          setStartTime(timeLabel(new Date(sl.start).toISOString()));
          setEndTime(timeLabel(new Date(end).toISOString()));
        };
        return (
          <div className="card daystrip">
            <div className="ds-head">
              <strong>Availability on this day</strong>
              <span className="muted">Showing 07:00 to 21:00</span>
            </div>
            <div className="ds-track">
              {availability.reservations.map((r) => (
                <div
                  key={r.id}
                  className="ds-busy"
                  style={{ left: `${pct(new Date(r.startTime).getTime())}%`, width: `${pct(new Date(r.endTime).getTime()) - pct(new Date(r.startTime).getTime())}%` }}
                  title={`${r.title}, ${timeLabel(r.startTime)}–${timeLabel(r.endTime)}`}
                />
              ))}
              {hasSel && (
                <div
                  className={`ds-pick${clashes.length ? " bad" : ""}`}
                  style={{ left: `${pct(selStart)}%`, width: `${pct(selEnd) - pct(selStart)}%` }}
                />
              )}
            </div>
            <div className="ds-scale">
              {[7, 10, 13, 16, 19, 21].map((h) => <span key={h}>{String(h).padStart(2, "0")}</span>)}
            </div>
            {clashes.length > 0 ? (
              <p className="ds-note bad">Overlaps {clashes.map((c) => `${c.title} (${timeLabel(c.startTime)}–${timeLabel(c.endTime)})`).join(", ")}. Pick a free time.</p>
            ) : (
              <p className="ds-note">
                {availability.reservations.length === 0
                  ? "Nothing booked yet. The whole day is free."
                  : `Booked: ${availability.reservations.map((r) => `${timeLabel(r.startTime)}–${timeLabel(r.endTime)}`).join(", ")}`}
              </p>
            )}
            <div className="slots">
              {slots.length === 0 && <span className="muted">No free time left in this window.</span>}
              {slots.map((sl, i) => (
                <button type="button" key={i} className="slot free" onClick={() => pickSlot(sl)} title="Use the start of this free slot">
                  {timeLabel(new Date(sl.start).toISOString())}–{timeLabel(new Date(sl.end).toISOString())}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

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
