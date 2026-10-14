import type { Pool } from "pg";
import { ConflictError, PG_UNIQUE_VIOLATION, pgCode } from "@/lib/errors";
import type { Resource } from "@/types";
import type { ResourceCreateInput, ResourceUpdateInput } from "@/lib/validation";

type ResourceRow = {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  is_active: boolean;
};

const SELECT = `
  SELECT r.id, r.category_id, c.name AS category_name, r.name, r.description,
         r.location, r.capacity, r.is_active
  FROM resources r
  JOIN resource_categories c ON c.id = r.category_id`;

const mapRow = (r: ResourceRow): Resource => ({
  id: r.id,
  categoryId: r.category_id,
  categoryName: r.category_name,
  name: r.name,
  description: r.description,
  location: r.location,
  capacity: r.capacity,
  isActive: r.is_active,
});

const COLUMN_MAP = {
  categoryId: "category_id",
  name: "name",
  description: "description",
  location: "location",
  capacity: "capacity",
  isActive: "is_active",
} as const;

export class ResourceRepository {
  constructor(private readonly db: Pool) {}

  async findAll(opts: { includeInactive?: boolean; categoryId?: number } = {}): Promise<Resource[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (!opts.includeInactive) where.push("r.is_active = TRUE");
    if (opts.categoryId) {
      params.push(opts.categoryId);
      where.push(`r.category_id = $${params.length}`);
    }
    const sql = `${SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY c.name, r.name`;
    const { rows } = await this.db.query<ResourceRow>(sql, params);
    return rows.map(mapRow);
  }

  async findById(id: number): Promise<Resource | null> {
    const { rows } = await this.db.query<ResourceRow>(`${SELECT} WHERE r.id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: ResourceCreateInput): Promise<Resource> {
    try {
      const { rows } = await this.db.query<{ id: number }>(
        `INSERT INTO resources (category_id, name, description, location, capacity)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [data.categoryId, data.name, data.description ?? null, data.location ?? null, data.capacity ?? null],
      );
      return (await this.findById(rows[0].id))!;
    } catch (err) {
      this.rethrowDuplicate(err);
      throw err;
    }
  }

  async update(id: number, patch: ResourceUpdateInput): Promise<Resource> {
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const key of Object.keys(COLUMN_MAP) as (keyof typeof COLUMN_MAP)[]) {
      const value = patch[key];
      if (value !== undefined) {
        params.push(value);
        sets.push(`${COLUMN_MAP[key]} = $${params.length}`);
      }
    }
    if (sets.length > 0) {
      params.push(id);
      try {
        await this.db.query(
          `UPDATE resources SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length}`,
          params,
        );
      } catch (err) {
        this.rethrowDuplicate(err);
        throw err;
      }
    }
    return (await this.findById(id))!;
  }

  private rethrowDuplicate(err: unknown) {
    if (pgCode(err) === PG_UNIQUE_VIOLATION) {
      throw new ConflictError("A resource with this name already exists");
    }
  }
}
