import { json, readJson, route } from "@/lib/http";
import { resourceService } from "@/server/container";

export const dynamic = "force-dynamic";

export const GET = (req: Request) =>
  route(async () => {
    const sp = new URL(req.url).searchParams;
    const categoryId = Number(sp.get("categoryId")) || undefined;
    return json(await resourceService.list({ includeInactive: sp.get("includeInactive") === "true", categoryId }));
  });

export const POST = (req: Request) =>
  route(async () => json(await resourceService.create(await readJson(req)), 201));
