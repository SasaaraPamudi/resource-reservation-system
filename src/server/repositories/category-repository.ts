import type { Pool } from "pg";
import type { Category } from "@/types";

export class CategoryRepository {
  constructor(private readonly db: Pool) {}

  async findAll(): Promise<Category[]> {
    const { rows } = await this.db.query<Category>(
      "SELECT id, name FROM resource_categories ORDER BY name",
    );
    return rows;
  }

  async exists(id: number): Promise<boolean> {
    const { rowCount } = await this.db.query("SELECT 1 FROM resource_categories WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  }
}
