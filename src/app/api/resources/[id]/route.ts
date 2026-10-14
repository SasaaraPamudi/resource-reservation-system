import { json, parseId, readJson, route } from "@/lib/http";
import { resourceService } from "@/server/container";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, { params }: Ctx) =>
  route(async () => json(await resourceService.get(parseId((await params).id))));

export const PATCH = (req: Request, { params }: Ctx) =>
  route(async () => json(await resourceService.update(parseId((await params).id), await readJson(req))));
