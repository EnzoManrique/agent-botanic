/**
 * Helpers para tolerar fallos transitorios de los proveedores LLM.
 *
 * Por qué existe este archivo:
 * Cuando Gemini / OpenAI / Anthropic tienen pico de demanda devuelven errores
 * tipo "model is currently experiencing high demand", "overloaded", 503 o
 * 429. La AI SDK reintenta 3 veces internamente pero si TODOS los intentos
 * fallan tira el error al consumidor — y nuestro usuario terminaba viendo
 * un mensaje técnico en inglés cortado a la mitad.
 *
 * Acá centralizamos:
 *  1. Detección de errores transitorios (`isOverloadError`).
 *  2. Conversión a mensajes humanos en castellano (`humanizeAiError`).
 *  3. Fallback secuencial entre modelos (`tryModelsInOrder`) para acciones
 *     no-streaming: si el modelo principal está saturado probamos el
 *     siguiente antes de fallar.
 */

/**
 * Devuelve true si el error pinta a "el modelo está saturado, probá luego"
 * — útil para decidir si reintentar con otro modelo.
 */
export function isOverloadError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes("overloaded") ||
    msg.includes("high demand") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    msg.includes("too many requests") ||
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("unavailable") ||
    msg.includes("timeout") ||
    msg.includes("timed out")
  )
}

/**
 * Convierte un error técnico de un LLM en un mensaje en castellano amigable
 * para mostrar en un toast. Pensado para que lo entienda alguien que no es
 * developer (ej. mi mamá usando la app).
 */
export function humanizeAiError(err: unknown): string {
  if (isOverloadError(err)) {
    return "El servicio de IA está con mucha demanda en este momento. Esperá unos segundos y volvé a intentarlo."
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (
      msg.includes("network") ||
      msg.includes("fetch failed") ||
      msg.includes("failed to fetch")
    ) {
      return "No pude conectarme. Revisá tu conexión a internet y probá de nuevo."
    }
    if (
      msg.includes("api key") ||
      msg.includes("api_key") ||
      msg.includes("401") ||
      msg.includes("403") ||
      msg.includes("unauthorized")
    ) {
      return "Hubo un problema de autenticación con el servicio de IA. Pedile al admin que revise las credenciales."
    }
    if (msg.includes("safety") || msg.includes("blocked")) {
      return "El servicio bloqueó la respuesta por filtros de seguridad. Probá con otra foto o reformulando la pregunta."
    }
  }
  return "Algo salió mal procesando tu pedido. Probá de nuevo en unos segundos."
}

/**
 * Ejecuta `fn` con cada modelo de la lista en orden hasta que uno responda.
 * Si el primer modelo falla por SOBRECARGA, prueba con el siguiente.
 * Si falla por otra razón (ej. JSON inválido), corta y propaga el error.
 *
 * Pensado para `generateText` / `generateObject` (acciones no-streaming).
 * No se puede usar con streamText porque ahí los chunks ya pudieron empezar
 * a llegar antes de detectar el error.
 *
 * Ejemplo:
 *   const result = await tryModelsInOrder(
 *     [google("gemini-2.5-flash"), google("gemini-2.0-flash")],
 *     async (model) => generateText({ model, prompt: "..." }),
 *   )
 */
export async function tryModelsInOrder<TModel, TResult>(
  models: TModel[],
  fn: (model: TModel) => Promise<TResult>,
): Promise<TResult> {
  if (models.length === 0) {
    throw new Error("tryModelsInOrder: necesita al menos un modelo")
  }

  let lastError: unknown = null
  for (let i = 0; i < models.length; i++) {
    try {
      return await fn(models[i])
    } catch (err) {
      lastError = err
      const isLastModel = i === models.length - 1
      // Sólo seguimos al siguiente modelo si el error parece transitorio.
      // Para errores de schema o de input directamente fallamos.
      if (isLastModel || !isOverloadError(err)) {
        throw err
      }
      console.warn(
        `[v0] Modelo ${i + 1}/${models.length} saturado, probando con el siguiente:`,
        err instanceof Error ? err.message : err,
      )
    }
  }

  // Inalcanzable — el for-loop siempre retorna o lanza.
  throw lastError
}
