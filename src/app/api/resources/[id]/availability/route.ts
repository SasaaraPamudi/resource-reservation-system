import { json, parseId, route } from "@/lib/http";
import { reservationService } from "@/server/container";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = (req: Request, { params }: Ctx) =>
  route(async () => {
    const sp = new URL(req.url).searchParams;
    const id = parseId((await params).id);
    return json(await reservationService.getAvailability(id, sp.get("from"), sp.get("to")));
  });
