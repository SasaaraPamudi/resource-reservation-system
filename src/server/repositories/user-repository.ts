import type { Pool } from "pg";

export class UserRepository {
  constructor(private readonly db: Pool) {}

  /** Users are identified by email. Returns the user id. */
  async upsertByEmail(name: string, email: string, team: string | null): Promise<number> {
    const { rows } = await this.db.query<{ id: number }>(
      `INSERT INTO users (name, email, team) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, team = COALESCE(EXCLUDED.team, users.team)
       RETURNING id`,
      [name, email, team],
    );
    return rows[0].id;
  }
}
