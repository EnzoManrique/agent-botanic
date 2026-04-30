/**
 * Utilidades de imagen del lado del cliente.
 *
 * Bajar la resolución antes de mandar a la IA tiene tres beneficios:
 *  - Más rápido (uploads más livianos sobre 4G).
 *  - Menos tokens consumidos en el modelo de visión.
 *  - Menos chance de timeout.
 * Con 1024px de lado más largo y JPEG 0.8 alcanza de sobra para identificar.
 */
export async function downscaleImage(
  dataUrl: string,
  maxSide = 1024,
  quality = 0.8,
): Promise<string> {
  // Sólo corre en cliente; en server retornamos el original.
  if (typeof window === "undefined") return dataUrl

  return new Promise<string>((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const longest = Math.max(img.width, img.height)
      const scale = longest > maxSide ? maxSide / longest : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      try {
        resolve(canvas.toDataURL("image/jpeg", quality))
      } catch {
        // Si falla (CORS o lo que sea), devolvemos el original
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
