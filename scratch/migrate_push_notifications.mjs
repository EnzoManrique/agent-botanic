import { config } from "dotenv"
config({ path: ".env.local" })
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error("No connection string found. Please make sure DATABASE_URL or POSTGRES_URL is configured in .env.local.");
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  try {
    console.log("Creating push_subscriptions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
