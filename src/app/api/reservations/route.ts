import { ValidationError } from "@/lib/errors";
import { json, readJson, route } from "@/lib/http";
import { reservationService } from "@/server/container";
import type { ReservationScope, ReservationStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUSES = ["confirmed", "cancelled"];
const SCOPES = ["upcoming", "past", "all"];

export const GET = (req: Request) =>
  route(async () => {
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");
    const scope = sp.get("scope");
    if (status && !STATUSES.includes(status)) throw new ValidationError("Invalid status");
    if (scope && !SCOPES.includes(scope)) throw new ValidationError("Invalid scope");
    return json(
      await reservationService.list({
        resourceId: Number(sp.get("resourceId")) || undefined,
        status: (status as ReservationStatus) || undefined,
        scope: (scope as ReservationScope) || undefined,
        page: Number(sp.get("page")) || 1,
        pageSize: Number(sp.get("pageSize")) || 20,
      }),
    );
  });

export const POST = (req: Request) =>
  route(async () => json(await reservationService.create(await readJson(req)), 201));
