import { json, route } from "@/lib/http";
import { dashboardService } from "@/server/container";

export const dynamic = "force-dynamic";

export const GET = () => route(async () => json(await dashboardService.getOverview()));
