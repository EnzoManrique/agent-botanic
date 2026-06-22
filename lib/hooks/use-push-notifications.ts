"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [loading, setLoading] = useState(true)
  const [isSendingTest, setIsSendingTest] = useState(false)

  // Verificar soporte y suscripción existente
  useEffect(() => {
    if (typeof window === "undefined") return

    const checkSupport = async () => {
      const serviceWorkerSupported = "serviceWorker" in navigator
      const pushSupported = "PushManager" in window

      if (serviceWorkerSupported && pushSupported) {
        setIsSupported(true)
        setPermission(Notification.permission)

        try {
          // Registrar sw.js si no está registrado
          const registration = await navigator.serviceWorker.register("/sw.js")
          const sub = await registration.pushManager.getSubscription()
          setSubscription(sub)
        } catch (err) {
          console.error("Error al registrar el Service Worker o verificar suscripción:", err)
        }
      } else {
        setIsSupported(false)
      }
      setLoading(false)
    }

    checkSupport()
  }, [])

  const subscribeToPush = useCallback(async () => {
    if (!isSupported) {
      toast.error("Tu navegador no soporta notificaciones push.")
      return null
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en las variables de entorno.")
      toast.error("Error de configuración: falta la clave pública VAPID.")
      return null
    }

    setLoading(true)
    try {
      // 1. Solicitar permisos de notificación si están por defecto
      let currentPermission = Notification.permission
      if (currentPermission === "default") {
        currentPermission = await Notification.requestPermission()
        setPermission(currentPermission)
      }

      if (currentPermission !== "granted") {
        toast.error("Permiso de notificaciones denegado.")
        setLoading(false)
        return null
      }

      // 2. Obtener registro del SW
      const registration = await navigator.serviceWorker.ready

      // 3. Suscribir al servicio de notificaciones push de la PWA
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      })

      // 4. Guardar suscripción en la base de datos de la app
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "No pudimos guardar la suscripción en el servidor.")
      }

      setSubscription(sub)
      toast.success("¡Suscrito con éxito a las notificaciones! 🌿")
      return sub
    } catch (err: any) {
      console.error("Error al suscribirse a notificaciones push:", err)
      toast.error(err.message || "Error al activar las notificaciones.")
      return null
    } finally {
      setLoading(false)
    }
  }, [isSupported])

  const unsubscribeFromPush = useCallback(async () => {
    if (!isSupported || !subscription) return false

    setLoading(true)
    try {
      // 1. Eliminar suscripción del servidor de notificaciones nativo del browser
      await subscription.unsubscribe()

      // 2. Eliminar del backend en Neon
      await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })

      setSubscription(null)
      toast.success("Desactivaste las notificaciones. No te enviaremos más alertas.")
      return true
    } catch (err: any) {
      console.error("Error al desuscribirse de las notificaciones push:", err)
      toast.error("Error al desactivar las notificaciones.")
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported, subscription])

  const sendTestNotification = useCallback(async () => {
    if (!subscription) {
      toast.error("Primero debes activar las notificaciones push.")
      return
    }

    setIsSendingTest(true)
    try {
      const response = await fetch("/api/notifications/send-test", {
        method: "POST"
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al enviar la notificación.")
      }

      toast.success("Enviamos una notificación de prueba a tu dispositivo.")
    } catch (err: any) {
      console.error("Error al enviar notificación de prueba:", err)
      toast.error(err.message || "No pudimos enviar la notificación de prueba.")
    } finally {
      setIsSendingTest(false)
    }
  }, [subscription])

  return {
    isSupported,
    isSubscribed: !!subscription,
    permission,
    loading,
    isSendingTest,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  }
}
