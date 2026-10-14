import { pool } from "@/lib/db";
import { CategoryRepository } from "./repositories/category-repository";
import { ReservationRepository } from "./repositories/reservation-repository";
import { ResourceRepository } from "./repositories/resource-repository";
import { UserRepository } from "./repositories/user-repository";
import { DashboardService } from "./services/dashboard-service";
import { ReservationService } from "./services/reservation-service";
import { ResourceService } from "./services/resource-service";

const categoryRepo = new CategoryRepository(pool);
const resourceRepo = new ResourceRepository(pool);
const reservationRepo = new ReservationRepository(pool);
const userRepo = new UserRepository(pool);

export const resourceService = new ResourceService(resourceRepo, categoryRepo, reservationRepo);
export const reservationService = new ReservationService(reservationRepo, resourceRepo, userRepo);
export const dashboardService = new DashboardService(reservationRepo);
