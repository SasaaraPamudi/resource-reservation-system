"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function CancelButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!confirm("Cancel this reservation?")) return;
    setBusy(true);
    try {
      await api(`/api/reservations/${id}/cancel`, { method: "POST" });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn small danger" onClick={cancel} disabled={busy}>
      Cancel
    </button>
  );
}
