import { auth } from "@/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import webpush from "web-push"

// Configuración de Web Push
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const privateKey = process.env.VAPID_PRIVATE_KEY || ""
const subject = process.env.VAPID_SUBJECT || "mailto:enzo@example.com"

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: "Las claves VAPID no están configuradas en el servidor" },
        { status: 500 }
      )
    }

    const userId = parseInt(session.user.id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 })
    }

    // Obtener todas las suscripciones de este usuario
    const subscriptions = await sql`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ${userId}
    `

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No tenés ningún dispositivo suscrito a las notificaciones" },
        { status: 404 }
      )
    }

    const payload = JSON.stringify({
      title: "¡Hola desde Secretary Botanic! 🌿",
      body: "Las notificaciones push están configuradas correctamente. ¡Te avisaremos cuando tus plantas necesiten agua!",
      icon: "/icon.svg",
      badge: "/icon.svg",
      url: "/"
    })

    const results = await Promise.all(
      subscriptions.map(async (sub: any) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        try {
          await webpush.sendNotification(pushSub, payload)
          return { endpoint: sub.endpoint, status: "sent" }
        } catch (error: any) {
          console.error("Error al enviar notificación:", error)

          // Si el endpoint ya no existe (410 o 404), borramos la suscripción obsoleta
          if (error.statusCode === 410 || error.statusCode === 404) {
            await sql`
              DELETE FROM push_subscriptions
              WHERE endpoint = ${sub.endpoint}
            `
            return { endpoint: sub.endpoint, status: "expired_deleted" }
          }

          return { endpoint: sub.endpoint, status: "failed", error: error.message }
        }
      })
    )

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("Error en send-test:", error)
    return NextResponse.json(
      { error: error.message || "Error interno al enviar la notificación" },
      { status: 500 }
    )
  }
}
