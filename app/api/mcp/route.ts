import { NextRequest } from "next/server"
import { resolveMcpToken } from "@/lib/db/mcp-tokens"
import { getAllPlants } from "@/lib/db/plants"
import { getUserSettings } from "@/lib/db/settings"
import { evaluateAlerts, getForecast } from "@/lib/weather"
import {
  searchMercadoLibre,
  extractStateFromCity,
} from "@/lib/mercadolibre"

/**
 * Servidor MCP (Model Context Protocol) de Secretary Botanic.
 *
 * Implementa el subset core del protocolo MCP sobre HTTP/JSON-RPC 2.0:
 * https://modelcontextprotocol.io/specification/2025-03-26
 *
 * Métodos soportados:
 *   - `initialize`     — handshake inicial; declara capabilities y serverInfo.
 *   - `tools/list`     — lista las tools que el cliente puede invocar.
 *   - `tools/call`     — ejecuta una tool con argumentos validados.
 *
 * Cualquier cliente compatible MCP (Claude Desktop, scripts custom, futuras
 * integraciones con Alexa/Google Home) puede conectarse mandando POST a
 * `/api/mcp` con `Authorization: Bearer botanic_xxx`.
 *
 * Decisiones tomadas para el alcance del hackathon:
 * - No usamos el SDK oficial @modelcontextprotocol/sdk porque está pensado
 *   para servidores Node con stdio, y nuestro entorno es serverless. Hablar
 *   JSON-RPC a mano no es difícil y queda totalmente compatible con el spec.
 * - No implementamos `resources` ni `prompts` (son opcionales en MCP).
 * - El transport es HTTP simple (no SSE / streaming). Es suficiente para
 *   herramientas que devuelven respuestas en <8s.
 */

export const maxDuration = 30

// ---------- Tipos JSON-RPC ----------

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id?: string | number | null
  method: string
  params?: unknown
}

interface JsonRpcResponse {
  jsonrpc: "2.0"
  id: string | number | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

const ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Espacio reservado para errores de aplicación (-32000 a -32099)
  UNAUTHORIZED: -32001,
  TOOL_EXECUTION_FAILED: -32002,
} as const

// ---------- Definición de tools ----------

/**
 * Catálogo de tools que expone el server. Cada una declara su input schema
 * en JSON Schema (formato MCP) y un executor que recibe el input y el
 * userEmail resuelto del token. Mantenemos esto en un solo lugar para que
 * tools/list y tools/call usen exactamente la misma definición.
 */
const TOOLS = {
  list_plants: {
    description:
      "Devuelve todas las plantas registradas por el usuario, con su ubicación física, modo de cuidado, frecuencia y último riego.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    async execute(_input: unknown, ctx: { userEmail: string }) {
      const plants = await getAllPlants(ctx.userEmail)
      return {
        total: plants.length,
        plants: plants.map((p) => ({
          id: p.id,
          alias: p.alias,
          species: p.species,
          category: p.category,
          location: p.location,
          wateringMode: p.wateringMode,
          wateringFrequencyDays: p.wateringFrequencyDays,
          lightNeeds: p.lightNeeds,
          lastWateredAt: p.lastWateredAt
            ? new Date(p.lastWateredAt).toISOString()
            : null,
        })),
      }
    },
  },

  get_watering_today: {
    description:
      "Identifica qué plantas necesitan riego hoy según su frecuencia de cuidado y la fecha del último riego.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    async execute(_input: unknown, ctx: { userEmail: string }) {
      const plants = await getAllPlants(ctx.userEmail)
      const now = Date.now()
      const items = plants
        .map((p) => {
          const daysSince = p.lastWateredAt
            ? Math.floor((now - p.lastWateredAt) / (1000 * 60 * 60 * 24))
            : null
          const needsWater =
            daysSince === null || daysSince >= p.wateringFrequencyDays
          return {
            alias: p.alias,
            species: p.species,
            wateringMode: p.wateringMode,
            wateringFrequencyDays: p.wateringFrequencyDays,
            daysSinceLastWatering: daysSince,
            needsWater,
          }
        })
        .filter((p) => p.needsWater)
      return { count: items.length, plants: items }
    },
  },

  get_weather_alerts: {
    description:
      "Devuelve alertas climáticas REALES (Open-Meteo) para la ciudad del usuario: viento Zonda, helada, granizo y ola de calor, filtradas según las preferencias activadas en su perfil.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    async execute(_input: unknown, ctx: { userEmail: string }) {
      const settings = await getUserSettings(ctx.userEmail)
      const city = settings.location.city || "Mendoza, Argentina"
      const forecast = await getForecast(city)
      const alerts = evaluateAlerts(forecast, settings.location.alerts)
      return {
        location: forecast.location.label,
        now: {
          tempC: Math.round(forecast.current.tempC),
          humidity: Math.round(forecast.current.humidity),
          windKmh: Math.round(forecast.current.windKmh),
        },
        alerts,
      }
    },
  },

  get_plant_care_tips: {
    description:
      "Devuelve consejos de cuidado específicos para una planta concreta del usuario, incluyendo riego, luz y posibles riesgos por su ubicación.",
    inputSchema: {
      type: "object",
      properties: {
        aliasOrId: {
          type: "string",
          description: "Alias (apodo) o id de la planta del usuario.",
        },
      },
      required: ["aliasOrId"],
      additionalProperties: false,
    },
    async execute(
      input: unknown,
      ctx: { userEmail: string },
    ) {
      const aliasOrId = (input as { aliasOrId?: string })?.aliasOrId
      if (!aliasOrId || typeof aliasOrId !== "string") {
        throw new Error("aliasOrId es obligatorio")
      }
      const plants = await getAllPlants(ctx.userEmail)
      const q = aliasOrId.toLowerCase()
      const plant = plants.find(
        (p) => p.id.toLowerCase() === q || p.alias.toLowerCase() === q,
      )
      if (!plant) {
        return {
          found: false,
          message: `No encontré una planta con "${aliasOrId}".`,
        }
      }
      return {
        found: true,
        alias: plant.alias,
        species: plant.species,
        category: plant.category,
        location: plant.location,
        wateringMode: plant.wateringMode,
        wateringFrequencyDays: plant.wateringFrequencyDays,
        lightNeeds: plant.lightNeeds,
      }
    },
  },

  search_products: {
    description:
      "Busca productos relacionados con jardinería en Mercado Libre Argentina (fertilizantes, sustratos, macetas, herramientas). Prioriza vendedores en la provincia del usuario para minimizar costos de envío. Devuelve título, precio, ubicación y link.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Texto de búsqueda libre, ej. "fertilizante para potus" o "perlita 5 litros".',
        },
        limit: {
          type: "number",
          description: "Cantidad máxima de productos a devolver (1-10).",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    async execute(input: unknown, ctx: { userEmail: string }) {
      const query = (input as { query?: string })?.query
      if (!query || typeof query !== "string") {
        throw new Error("query es obligatorio")
      }
      const limitRaw = (input as { limit?: number })?.limit
      const limit = typeof limitRaw === "number" ? limitRaw : 6

      const settings = await getUserSettings(ctx.userEmail)
      const preferredState = extractStateFromCity(settings.location.city)
      const products = await searchMercadoLibre(query, {
        preferredState,
        limit,
      })
      return {
        query,
        preferredState,
        count: products.length,
        products,
      }
    },
  },
} as const

type ToolName = keyof typeof TOOLS

// ---------- Auth ----------

async function authenticate(
  req: NextRequest,
): Promise<{ userEmail: string } | null> {
  const header = req.headers.get("authorization") || ""
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const resolved = await resolveMcpToken(match[1].trim())
  if (!resolved) return null
  return { userEmail: resolved.userEmail }
}

// ---------- Handlers JSON-RPC ----------

async function handleRequest(
  rpc: JsonRpcRequest,
  ctx: { userEmail: string },
): Promise<JsonRpcResponse> {
  const id = rpc.id ?? null

  try {
    switch (rpc.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2025-03-26",
            capabilities: { tools: {} },
            serverInfo: {
              name: "secretary-botanic",
              version: "1.0.0",
            },
          },
        }

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: Object.entries(TOOLS).map(([name, def]) => ({
              name,
              description: def.description,
              inputSchema: def.inputSchema,
            })),
          },
        }

      case "tools/call": {
        const params = (rpc.params ?? {}) as {
          name?: string
          arguments?: unknown
        }
        const toolName = params.name as ToolName | undefined
        if (!toolName || !(toolName in TOOLS)) {
          return rpcError(id, ERROR_CODES.METHOD_NOT_FOUND, `Tool desconocida: ${toolName}`)
        }
        try {
          const tool = TOOLS[toolName]
          const result = await tool.execute(params.arguments ?? {}, ctx)
          return {
            jsonrpc: "2.0",
            id,
            result: {
              // Formato MCP: cada tool devuelve un array de "content" parts.
              // Para simplicidad usamos un solo bloque de tipo "text" con
              // el JSON serializado — los clientes lo parsean fácil.
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
              isError: false,
              // Bonus no-estándar: incluimos también los datos crudos para
              // clientes que prefieran consumir JSON directo (ej. nuestra
              // página /integraciones cuando hagamos un "Probar tool").
              data: result,
            },
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error desconocido"
          return rpcError(
            id,
            ERROR_CODES.TOOL_EXECUTION_FAILED,
            `La tool "${toolName}" falló: ${message}`,
          )
        }
      }

      default:
        return rpcError(
          id,
          ERROR_CODES.METHOD_NOT_FOUND,
          `Método no soportado: ${rpc.method}`,
        )
    }
  } catch (err) {
    console.error("[v0] MCP handler error:", err)
    const message = err instanceof Error ? err.message : "Error interno"
    return rpcError(id, ERROR_CODES.INTERNAL_ERROR, message)
  }
}

function rpcError(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } }
}

// ---------- Route handler ----------

export async function POST(req: NextRequest) {
  // Auth primero, así no parseamos el body si el caller no está autorizado.
  const auth = await authenticate(req)
  if (!auth) {
    return jsonResponse(
      rpcError(null, ERROR_CODES.UNAUTHORIZED, "Token MCP inválido o ausente."),
      401,
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse(
      rpcError(null, ERROR_CODES.PARSE_ERROR, "JSON inválido."),
      400,
    )
  }

  // MCP soporta batch (array) y single. Implementamos ambos.
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((item) => handleRequest(item as JsonRpcRequest, auth)),
    )
    return jsonResponse(responses, 200)
  }

  if (!body || typeof body !== "object" || (body as JsonRpcRequest).jsonrpc !== "2.0") {
    return jsonResponse(
      rpcError(null, ERROR_CODES.INVALID_REQUEST, "Falta jsonrpc: '2.0'."),
      400,
    )
  }

  const response = await handleRequest(body as JsonRpcRequest, auth)
  return jsonResponse(response, 200)
}

/**
 * GET sin auth — devuelve metadata pública del server. Útil para que la
 * página /integraciones muestre el endpoint y un ejemplo, y para que
 * clientes verifiquen rápido que el server está vivo.
 */
export async function GET() {
  return jsonResponse(
    {
      name: "Secretary Botanic MCP Server",
      version: "1.0.0",
      protocolVersion: "2025-03-26",
      transport: "http+jsonrpc",
      authentication: "Bearer token (header Authorization)",
      tools: Object.keys(TOOLS),
      docs: "/perfil/integraciones",
    },
    200,
  )
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Permitimos CORS para que se pueda probar desde un curl o un cliente
      // arbitrario. Como auth es por header, esto no abre superficie nueva.
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
