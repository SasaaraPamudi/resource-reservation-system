import type { DashboardSummary, ResourceUsage } from "@/types";
import type { ReservationRepository } from "../repositories/reservation-repository";

export class DashboardService {
  constructor(private readonly reservations: ReservationRepository) {}

  async getOverview(): Promise<{ summary: DashboardSummary; usage: ResourceUsage[] }> {
    const [summary, usage] = await Promise.all([
      this.reservations.getSummary(),
      this.reservations.getUsageByResource(),
    ]);
    return { summary, usage };
  }
}
