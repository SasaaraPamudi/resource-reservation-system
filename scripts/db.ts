import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

async function run(commands: string[]) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    for (const cmd of commands) {
      const file = cmd === "migrate" ? "schema.sql" : cmd === "seed" ? "seed.sql" : null;
      if (!file) throw new Error(`Unknown command: ${cmd} (use "migrate" and/or "seed")`);
      await client.query(readFileSync(join(process.cwd(), "db", file), "utf8"));
      console.log(`✔ ${cmd} complete`);
    }
  } finally {
    await client.end();
  }
}

run(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});
