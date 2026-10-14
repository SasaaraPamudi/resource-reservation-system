import type { Pool } from "pg";
import type {
  DashboardSummary,
  Reservation,
  ReservationScope,
  ReservationStatus,
  ResourceUsage,
} from "@/types";

type ReservationRow = {
  id: number;
  resource_id: number;
  resource_name: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_team: string | null;
  title: string;
  notes: string | null;
  start_time: Date;
  end_time: Date;
  status: ReservationStatus;
  created_at: Date;
};

const SELECT = `
  SELECT r.id, r.resource_id, res.name AS resource_name, r.user_id,
         u.name AS user_name, u.email AS user_email, u.team AS user_team,
         r.title, r.notes, r.start_time, r.end_time, r.status, r.created_at
  FROM reservations r
  JOIN resources res ON res.id = r.resource_id
  JOIN users u ON u.id = r.user_id`;

const mapRow = (r: ReservationRow): Reservation => ({
  id: r.id,
  resourceId: r.resource_id,
  resourceName: r.resource_name,
  userId: r.user_id,
  userName: r.user_name,
  userEmail: r.user_email,
  userTeam: r.user_team,
  title: r.title,
  notes: r.notes,
  startTime: r.start_time.toISOString(),
  endTime: r.end_time.toISOString(),
  status: r.status,
  createdAt: r.created_at.toISOString(),
});

export interface ReservationFilters {
  resourceId?: number;
  status?: ReservationStatus;
  scope?: ReservationScope;
  from?: Date; // overlap window start
  to?: Date; // overlap window end
  page?: number;
  pageSize?: number;
}

export interface NewReservation {
  resourceId: number;
  userId: number;
  title: string;
  notes: string | null;
  startTime: Date;
  endTime: Date;
}

export class ReservationRepository {
  constructor(private readonly db: Pool) {}

  async list(f: ReservationFilters = {}): Promise<{ items: Reservation[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      where.push(sql.replace("?", `$${params.length}`));
    };

    if (f.resourceId) add("r.resource_id = ?", f.resourceId);
    if (f.status) add("r.status = ?", f.status);
    if (f.from) add("r.end_time > ?", f.from);
    if (f.to) add("r.start_time < ?", f.to);
    if (f.scope === "upcoming") where.push("r.end_time > now()");
    if (f.scope === "past") where.push("r.end_time <= now()");

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const order = f.scope === "upcoming" ? "ASC" : f.scope === "all" || f.scope === "past" ? "DESC" : "ASC";
    const pageSize = Math.min(Math.max(f.pageSize ?? 20, 1), 100);
    const offset = (Math.max(f.page ?? 1, 1) - 1) * pageSize;

    const [list, count] = await Promise.all([
      this.db.query<ReservationRow>(
        `${SELECT} ${whereSql} ORDER BY r.start_time ${order}, r.id LIMIT ${pageSize} OFFSET ${offset}`,
        params,
      ),
      this.db.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM reservations r ${whereSql}`,
        params,
      ),
    ]);
    return { items: list.rows.map(mapRow), total: count.rows[0].total };
  }

  async findById(id: number): Promise<Reservation | null> {
    const { rows } = await this.db.query<ReservationRow>(`${SELECT} WHERE r.id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  /** Confirmed reservations of a resource overlapping [start, end). */
  async findConflicts(resourceId: number, start: Date, end: Date): Promise<Reservation[]> {
    const { rows } = await this.db.query<ReservationRow>(
      `${SELECT}
       WHERE r.resource_id = $1 AND r.status = 'confirmed'
         AND tstzrange(r.start_time, r.end_time, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
       ORDER BY r.start_time`,
      [resourceId, start, end],
    );
    return rows.map(mapRow);
  }

  async create(data: NewReservation): Promise<number> {
    const { rows } = await this.db.query<{ id: number }>(
      `INSERT INTO reservations (resource_id, user_id, title, notes, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.resourceId, data.userId, data.title, data.notes, data.startTime, data.endTime],
    );
    return rows[0].id;
  }

  async markCancelled(id: number): Promise<void> {
    await this.db.query(
      "UPDATE reservations SET status = 'cancelled', cancelled_at = now() WHERE id = $1 AND status = 'confirmed'",
      [id],
    );
  }

  async countUpcomingForResource(resourceId: number): Promise<number> {
    const { rows } = await this.db.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM reservations
       WHERE resource_id = $1 AND status = 'confirmed' AND end_time > now()`,
      [resourceId],
    );
    return rows[0].n;
  }

  async getSummary(): Promise<DashboardSummary> {
    const { rows } = await this.db.query<{
      active_resources: number;
      upcoming: number;
      in_progress: number;
    }>(`SELECT
          (SELECT COUNT(*)::int FROM resources WHERE is_active) AS active_resources,
          (SELECT COUNT(*)::int FROM reservations WHERE status = 'confirmed' AND start_time > now()) AS upcoming,
          (SELECT COUNT(*)::int FROM reservations
             WHERE status = 'confirmed' AND start_time <= now() AND end_time > now()) AS in_progress`);
    const r = rows[0];
    return {
      activeResources: r.active_resources,
      upcomingReservations: r.upcoming,
      inProgressNow: r.in_progress,
    };
  }

  async getUsageByResource(): Promise<ResourceUsage[]> {
    const { rows } = await this.db.query<{
      resource_id: number;
      name: string;
      category_name: string;
      is_active: boolean;
      hours: number;
      upcoming_count: number;
      in_use_now: boolean;
    }>(
      `SELECT res.id AS resource_id, res.name, c.name AS category_name, res.is_active,
         COALESCE(SUM(EXTRACT(EPOCH FROM (
             LEAST(r.end_time, now()) - GREATEST(r.start_time, now() - interval '30 days')
           )) / 3600) FILTER (WHERE r.start_time < now() AND r.end_time > now() - interval '30 days'), 0)::float AS hours,
         (COUNT(r.id) FILTER (WHERE r.start_time > now()))::int AS upcoming_count,
         COALESCE(BOOL_OR(r.start_time <= now() AND r.end_time > now()), FALSE) AS in_use_now
       FROM resources res
       JOIN resource_categories c ON c.id = res.category_id
       LEFT JOIN reservations r ON r.resource_id = res.id AND r.status = 'confirmed'
       GROUP BY res.id, c.name
       ORDER BY hours DESC, res.name`,
    );
    return rows.map((r) => ({
      resourceId: r.resource_id,
      name: r.name,
      categoryName: r.category_name,
      isActive: r.is_active,
      hoursLast30Days: Math.round(r.hours * 10) / 10,
      upcomingCount: r.upcoming_count,
      inUseNow: r.in_use_now,
    }));
  }
}
