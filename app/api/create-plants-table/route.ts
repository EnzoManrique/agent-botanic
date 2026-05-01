import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await db.connect();
    
    // Usamos SERIAL para el ID, que funciona siempre sin extensiones raras
    await client.sql`
      CREATE TABLE IF NOT EXISTS plants (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        nickname TEXT NOT NULL,
        species TEXT NOT NULL,
        description TEXT,
        last_watered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        watering_frequency_days INTEGER NOT NULL,
        image_url TEXT,
        category TEXT
      );
    `;

    return NextResponse.json({ message: "¡Tabla de plantas creada con éxito en Neon!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}