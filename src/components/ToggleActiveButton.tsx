"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ToggleActiveButton({ id, isActive }: { id: number; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await api(`/api/resources/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn small" onClick={toggle} disabled={busy}>
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
