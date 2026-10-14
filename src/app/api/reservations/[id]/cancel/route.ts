import { json, parseId, route } from "@/lib/http";
import { reservationService } from "@/server/container";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const POST = (_req: Request, { params }: Ctx) =>
  route(async () => json(await reservationService.cancel(parseId((await params).id))));
