import { auth } from "@/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = parseInt(session.user.id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 })
    }

    const body = await req.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Datos de suscripción incompletos" }, { status: 400 })
    }

    // Insertar o actualizar la suscripción para el endpoint
    // Usamos ON CONFLICT (endpoint) DO UPDATE para no duplicar suscripciones
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
      ON CONFLICT (endpoint) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error al guardar suscripción:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint requerido" }, { status: 400 })
    }

    await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error al eliminar suscripción:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
