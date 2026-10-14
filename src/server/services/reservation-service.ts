import { ConflictError, NotFoundError, PG_EXCLUSION_VIOLATION, ValidationError, pgCode } from "@/lib/errors";
import { createReservationSchema } from "@/lib/validation";
import type { Availability, Reservation, ReservationScope, ReservationStatus, TimeSlot } from "@/types";
import type { ReservationRepository } from "../repositories/reservation-repository";
import type { ResourceRepository } from "../repositories/resource-repository";
import type { UserRepository } from "../repositories/user-repository";

const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 12 * 60 * 60 * 1000;
const PAST_GRACE_MS = 5 * 60 * 1000;
const MAX_AVAILABILITY_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

export interface ListReservationsQuery {
  resourceId?: number;
  status?: ReservationStatus;
  scope?: ReservationScope;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export class ReservationService {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly resources: ResourceRepository,
    private readonly users: UserRepository,
  ) {}

  list(query: ListReservationsQuery = {}) {
    return this.reservations.list(query);
  }

  async get(id: number): Promise<Reservation> {
    const reservation = await this.reservations.findById(id);
    if (!reservation) throw new NotFoundError("Reservation not found");
    return reservation;
  }

  async create(input: unknown): Promise<Reservation> {
    const data = createReservationSchema.parse(input);
    this.validateTimes(data.startTime, data.endTime);

    const resource = await this.resources.findById(data.resourceId);
    if (!resource) throw new NotFoundError("Resource not found");
    if (!resource.isActive) throw new ConflictError("This resource is not available for booking");

    // 1) Friendly pre-check that explains exactly what clashes.
    await this.assertNoConflict(data.resourceId, data.startTime, data.endTime);

    const userId = await this.users.upsertByEmail(data.userName, data.userEmail, data.userTeam ?? null);

    // 2) The DB exclusion constraint is the real guarantee: if two requests race
    //    past the pre-check, exactly one INSERT wins and the other is rejected here.
    try {
      const id = await this.reservations.create({
        resourceId: data.resourceId,
        userId,
        title: data.title,
        notes: data.notes ?? null,
        startTime: data.startTime,
        endTime: data.endTime,
      });
      return this.get(id);
    } catch (err) {
      if (pgCode(err) === PG_EXCLUSION_VIOLATION) {
        await this.assertNoConflict(data.resourceId, data.startTime, data.endTime);
        throw new ConflictError("This time slot was just booked by someone else");
      }
      throw err;
    }
  }

  async cancel(id: number): Promise<Reservation> {
    const reservation = await this.get(id);
    if (reservation.status === "cancelled") throw new ConflictError("Reservation is already cancelled");
    if (new Date(reservation.endTime) <= new Date()) {
      throw new ConflictError("Past reservations cannot be cancelled");
    }
    await this.reservations.markCancelled(id);
    return this.get(id);
  }

  /** Bookings and free slots for a resource inside [from, to). Free slots never start in the past. */
  async getAvailability(resourceId: number, fromRaw: unknown, toRaw: unknown): Promise<Availability> {
    const from = this.parseDate(fromRaw, "from");
    const to = this.parseDate(toRaw, "to");
    if (to <= from) throw new ValidationError("'to' must be after 'from'");
    if (to.getTime() - from.getTime() > MAX_AVAILABILITY_WINDOW_MS) {
      throw new ValidationError("Availability window cannot exceed 31 days");
    }
    if (!(await this.resources.findById(resourceId))) throw new NotFoundError("Resource not found");

    const { items } = await this.reservations.list({
      resourceId,
      status: "confirmed",
      from,
      to,
      pageSize: 100,
    });
    const booked = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

    const freeSlots: TimeSlot[] = [];
    let cursor = new Date(Math.max(from.getTime(), Date.now()));
    for (const r of booked) {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      if (start > cursor) freeSlots.push({ start: cursor.toISOString(), end: new Date(Math.min(start.getTime(), to.getTime())).toISOString() });
      if (end > cursor) cursor = end;
    }
    if (cursor < to) freeSlots.push({ start: cursor.toISOString(), end: to.toISOString() });

    return { reservations: booked, freeSlots };
  }

  private validateTimes(start: Date, end: Date) {
    const duration = end.getTime() - start.getTime();
    if (duration <= 0) throw new ValidationError("End time must be after start time");
    if (duration < MIN_DURATION_MS) throw new ValidationError("Reservations must be at least 15 minutes long");
    if (duration > MAX_DURATION_MS) throw new ValidationError("Reservations cannot be longer than 12 hours");
    if (start.getTime() < Date.now() - PAST_GRACE_MS) throw new ValidationError("Start time cannot be in the past");
  }

  private async assertNoConflict(resourceId: number, start: Date, end: Date) {
    const conflicts = await this.reservations.findConflicts(resourceId, start, end);
    if (conflicts.length > 0) {
      throw new ConflictError(
        "This resource is already booked for part of the requested time",
        conflicts.map((c) => ({ title: c.title, startTime: c.startTime, endTime: c.endTime })),
      );
    }
  }

  private parseDate(raw: unknown, name: string): Date {
    const d = new Date(String(raw ?? ""));
    if (Number.isNaN(d.getTime())) throw new ValidationError(`'${name}' must be a valid date-time`);
    return d;
  }
}
