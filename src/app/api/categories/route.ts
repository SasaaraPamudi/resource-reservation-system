import { json, route } from "@/lib/http";
import { resourceService } from "@/server/container";

export const dynamic = "force-dynamic";

export const GET = () => route(async () => json(await resourceService.listCategories()));
