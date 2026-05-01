/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Next.js 16 bloquea por defecto cualquier request cross-origin a recursos
  // del dev server (chunks de JS, HMR, fast refresh) desde dominios que no
  // sean localhost. El preview de v0 corre la app en un iframe servido
  // desde *.vusercontent.net y *.v0.app, así que sin esto NINGÚN
  // botón responde porque los chunks de cliente nunca llegan.
  // Sólo afecta `next dev` — en producción no tiene efecto.
  allowedDevOrigins: ["*.vusercontent.net", "*.v0.app", "*.vercel.app"],
}

export default nextConfig
