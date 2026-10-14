export type ReservationStatus = "confirmed" | "cancelled";
export type ReservationScope = "upcoming" | "past" | "all";

export interface Category {
  id: number;
  name: string;
}

export interface Resource {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  isActive: boolean;
}

export interface Reservation {
  id: number;
  resourceId: number;
  resourceName: string;
  userId: number;
  userName: string;
  userEmail: string;
  userTeam: string | null;
  title: string;
  notes: string | null;
  startTime: string; 
  endTime: string; 
  status: ReservationStatus;
  createdAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Availability {
  reservations: Reservation[];
  freeSlots: TimeSlot[];
}

export interface DashboardSummary {
  activeResources: number;
  upcomingReservations: number;
  inProgressNow: number;
}

export interface ResourceUsage {
  resourceId: number;
  name: string;
  categoryName: string;
  isActive: boolean;
  hoursLast30Days: number;
  upcomingCount: number;
  inUseNow: boolean;
}
