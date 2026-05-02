
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error("No connection string found. Please run this command manually in your Neon/Vercel console:");
  console.log("ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;");
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  try {
    console.log("Migrating database...");
    await sql`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    `;
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
