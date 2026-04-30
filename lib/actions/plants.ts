"use server"

import { revalidatePath } from "next/cache"
import { generateText, Output } from "ai"
import { z } from "zod"
import { auth } from "@/auth"
import {
  createPlant,
  deletePlant as dbDeletePlant,
  getAllPlants as dbGetAllPlants,
  getPlantById as dbGetPlantById,
  markWatered,
  updatePlantDetails as dbUpdatePlantDetails,
} from "@/lib/db/plants"
import { addCareLog } from "@/lib/db/care-logs"
import { sql } from "@/lib/db"
import type {
  Plant,
  PlantCategory,
  PlantIdentification,
  WateringMode,
} from "@/lib/types"

/* -------------------------------------------------------------------------- */
/* savePlant — insert simple usado desde el front si quieren registrar manual  */
/* -------------------------------------------------------------------------- */

const SavePlantSchema = z.object({
  nickname: z.string().trim().min(1, "Ponele un apodo a tu planta."),
  species: z.string().trim().min(1, "Necesitamos saber la especie."),
  watering_frequency_days: z
    .number()
    .int()
    .min(1, "Mínimo 1 día.")
    .max(60, "Máximo 60 días."),
  category: z.string().trim().min(1, "Elegí una categoría."),
})

export type SavePlantInput = z.infer<typeof SavePlantSchema>
export type SavePlantResult =
  | { ok: true; id: number }
  | { ok: false; error: string }

export async function savePlant(input: SavePlantInput): Promise<SavePlantResult> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión para guardar plantas." }
  }
  const parsed = SavePlantSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }
  try {
    const rows = (await sql`
      INSERT INTO plants (user_email, nickname, species, watering_frequency_days, category)
      VALUES (
        ${session.user.email},
        ${parsed.data.nickname},
        ${parsed.data.species},
        ${parsed.data.watering_frequency_days},
        ${parsed.data.category}
      )
      RETURNING id
    `) as { id: number }[]
    revalidatePath("/jardin")
    revalidatePath("/")
    return { ok: true, id: rows[0]?.id ?? 0 }
  } catch (error) {
    console.error("[v0] Error guardando planta:", error)
    return { ok: false, error: "No pudimos guardar la planta en el jardín." }
  }
}

/* -------------------------------------------------------------------------- */
/* updatePlantDetails — usuario corrige info que la IA identificó             */
/* -------------------------------------------------------------------------- */

export interface PlantDetailsPatch {
  alias?: string
  species?: string
  scientificName?: string
  category?: PlantCategory
  wateringFrequencyDays?: number
  wateringMode?: WateringMode
  lightNeeds?: "alta" | "media" | "baja"
  notes?: string
}

export async function updatePlantDetails(
  plantId: string,
  patch: PlantDetailsPatch,
): Promise<{ ok: boolean; plant?: Plant; error?: string }> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión." }
  }

  // Validamos rango numérico (max/min) antes de tocar la DB.
  const cleanWatering =
    typeof patch.wateringFrequencyDays === "number"
      ? Math.max(1, Math.min(60, Math.round(patch.wateringFrequencyDays)))
      : undefined

  const updated = await dbUpdatePlantDetails(session.user.email, plantId, {
    alias: patch.alias?.trim() || undefined,
    species: patch.species?.trim() || undefined,
    scientificName: patch.scientificName?.trim() || undefined,
    category: patch.category,
    wateringFrequencyDays: cleanWatering,
    wateringMode: patch.wateringMode,
    lightNeeds: patch.lightNeeds,
    notes: patch.notes,
  })
  if (!updated) {
    return { ok: false, error: "No encontré esa planta en tu jardín." }
  }

  revalidatePath("/")
  revalidatePath("/jardin")
  return { ok: true, plant: updated }
}

/* -------------------------------------------------------------------------- */
/* listPlantsAction — usado por el front para refrescar la lista              */
/* -------------------------------------------------------------------------- */

export async function listPlantsAction(): Promise<Plant[]> {
  const session = await auth()
  if (!session?.user?.email) return []
  return dbGetAllPlants(session.user.email)
}

/* -------------------------------------------------------------------------- */
/* waterPlantAction — marca riego en plants + agrega care_log                 */
/* -------------------------------------------------------------------------- */

export async function waterPlantAction(plantId: string): Promise<{
  ok: boolean
  plant?: Plant
}> {
  const session = await auth()
  if (!session?.user?.email) return { ok: false }

  const plant = await markWatered(session.user.email, plantId)
  if (!plant) return { ok: false }

  // Best-effort: si falla el log no rompemos el riego.
  try {
    await addCareLog(session.user.email, plantId, "water", "Riego registrado")
  } catch (error) {
    console.error("[v0] Error guardando care_log:", error)
  }

  revalidatePath("/")
  revalidatePath("/jardin")
  return { ok: true, plant }
}

/* -------------------------------------------------------------------------- */
/* registerPlantAction — sumar al jardín una planta identificada por la IA    */
/* -------------------------------------------------------------------------- */

export async function registerPlantAction(input: {
  alias: string
  identification: PlantIdentification
  imageUrl?: string
}): Promise<{ ok: true; plant: Plant } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión." }
  }

  try {
    const plant = await createPlant(session.user.email, {
      alias: input.alias.trim() || input.identification.species,
      species: input.identification.species,
      scientificName: input.identification.scientificName,
      category: input.identification.category,
      wateringFrequencyDays: input.identification.wateringFrequencyDays,
      wateringMode: input.identification.wateringMode,
      lightNeeds: input.identification.lightNeeds,
      imageUrl: input.imageUrl,
      notes: input.identification.description,
    })
    revalidatePath("/")
    revalidatePath("/jardin")
    return { ok: true, plant }
  } catch (error) {
    console.error("[v0] Error registrando planta:", error)
    return { ok: false, error: "No pudimos registrar la planta." }
  }
}

/* -------------------------------------------------------------------------- */
/* deletePlantAction — elimina una planta del jardín del usuario              */
/* -------------------------------------------------------------------------- */

export async function deletePlantAction(
  plantId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión." }
  }
  const ok = await dbDeletePlant(session.user.email, plantId)
  if (!ok) {
    return { ok: false, error: "No encontré esa planta en tu jardín." }
  }
  revalidatePath("/")
  revalidatePath("/jardin")
  return { ok: true }
}

/* -------------------------------------------------------------------------- */
/* getPlantAction — opcional, por si alguna vista lo necesita en el futuro    */
/* -------------------------------------------------------------------------- */

export async function getPlantAction(plantId: string): Promise<Plant | null> {
  const session = await auth()
  if (!session?.user?.email) return null
  const plant = await dbGetPlantById(session.user.email, plantId)
  return plant ?? null
}

/* -------------------------------------------------------------------------- */
/* identifyPlantAction — visión real con Gemini vía Vercel AI Gateway         */
/* -------------------------------------------------------------------------- */

/**
 * Schema de salida estructurada. Hago que TODOS los campos sean requeridos
 * (regla de AI SDK 6 con strict mode); para "no es planta" usamos el flag
 * `isPlant: false` en lugar de campos opcionales.
 */
const IdentificationSchema = z.object({
  isPlant: z
    .boolean()
    .describe(
      "true si la imagen muestra claramente una planta (vegetal vivo, hoja, flor, tallo, raíz, suculenta, hongo NO cuenta). false en cualquier otro caso.",
    ),
  species: z
    .string()
    .describe(
      'Nombre común en español (ej: "Costilla de Adán", "Potus", "Aloe vera"). Si isPlant=false, devolvé "".',
    ),
  scientificName: z
    .string()
    .describe(
      'Nombre científico binomial (ej: "Monstera deliciosa"). Si no estás seguro o isPlant=false, devolvé "".',
    ),
  category: z
    .enum([
      "interior",
      "exterior",
      "suculenta",
      "comestible",
      "floracion",
      "tropical",
      "trepadora",
      "arbol",
      "acuatica",
      "hidroponia",
      "epifita",
      "bonsai",
    ])
    .describe(
      "Categoría más representativa. interior=plantas decorativas de interior; tropical=hojas grandes de selva (monstera, anthurium); trepadora=potus, hiedra, philodendron; suculenta=carnosas y cactus; epifita=orquídeas, tillandsias; acuatica=vive en agua; hidroponia=cultivo NFT/DWC; arbol=árboles y arbustos leñosos; bonsai=miniaturizado; floracion=ornamental por flor (rosa); comestible=aromáticas/hortalizas; exterior=jardín mediterráneo.",
    ),
  wateringFrequencyDays: z
    .number()
    .int()
    .min(1)
    .max(60)
    .describe(
      "Días entre acciones de cuidado, según el modo. soil=riego en tierra; water=cambio de agua; hydroponic=renovación de solución; mist=pulverización.",
    ),
  wateringMode: z
    .enum(["soil", "water", "hydroponic", "mist"])
    .describe(
      "soil=tierra (default para la mayoría); water=vive en agua (potus en frasco, lucky bamboo); hydroponic=sistema NFT/DWC con solución nutritiva; mist=epífitas/aéreas que se pulverizan.",
    ),
  lightNeeds: z
    .enum(["alta", "media", "baja"])
    .describe(
      "alta=sol directo o muy luminoso; media=luz indirecta brillante; baja=luz indirecta tenue, tolera sombra.",
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Tu certeza de la identificación. 0.95+ = muy seguro; 0.7-0.9 = probable; <0.7 = inseguro y conviene que el usuario edite.",
    ),
  description: z
    .string()
    .describe(
      "2-3 frases en español rioplatense con consejos concretos de cuidado para esta planta (luz, riego, sustrato, particularidades).",
    ),
})

const SYSTEM_PROMPT = `Sos un botánico experto identificando plantas a partir de una foto. El usuario está en Mendoza, Argentina (clima semiárido).

OBSERVÁ MUY DETENIDAMENTE antes de responder:
- Forma y borde de la hoja (entera, dentada, lobulada, perforada).
- Nervaduras (paralelas, palmadas, pinnadas).
- Textura (mate, brillante, carnosa, peluda).
- Tipo de tallo (herbáceo, leñoso, suculento, trepador).
- Disposición de hojas (alternas, opuestas, en roseta).
- Presencia de flores, frutos, espinas, areolas, raíces aéreas.
- Sustrato/maceta (tierra, agua, aire, hidropónico).

GUÍA ANTI-CONFUSIÓN (errores comunes que NO debés cometer):
- Potus (Epipremnum aureum): hojas acorazonadas grandes, brillantes, a veces variegadas. Trepadora/colgante. NO es albahaca.
- Filodendro corazón (Philodendron hederaceum): igual al potus pero hoja más mate y fina, sin variegación.
- Costilla de Adán (Monstera deliciosa): hojas grandes con perforaciones y cortes laterales (fenestraciones).
- Cinta / Mala madre (Chlorophytum comosum): hojas largas tipo lanza con franja blanca/crema central.
- Sansevieria / Lengua de suegra: hojas rígidas, erectas, carnosas, en abanico, bandas horizontales.
- ZZ (Zamioculcas zamiifolia): foliolos pequeños ovales, brillantes, sobre raquis carnoso.
- Albahaca (Ocimum basilicum): herbácea baja, hojas pequeñas ovaladas opuestas, tallo cuadrado, MUY aromática. NO es trepadora ni tiene hojas grandes brillantes.
- Suculentas vs cactus: suculentas tienen hojas carnosas y rara vez espinas; cactus tienen areolas con espinas y casi no tienen hojas verdaderas.

REGLAS DE CONFIANZA:
- Si la foto está borrosa, oscura, contrapicada, o no se ve claramente la planta: confidence ≤ 0.5.
- Si dudás entre 2 especies parecidas: elegí la más probable y bajá confidence a ~0.6-0.75.
- Solo usá confidence ≥ 0.9 cuando la identificación es inequívoca.
- Si en la foto NO hay una planta (mascota, persona, objeto, pared, comida procesada): isPlant=false, confidence=0, species="".

REGLAS DE CUIDADO según el modo:
- Si la planta vive en agua (potus en frasco, lucky bamboo, flores cortadas en agua) → wateringMode="water", frequency 7-14 días (cambio de agua).
- Si es hidropónica (lechuga, fresa en NFT) → wateringMode="hydroponic", frequency 10-14 días (renovación de solución).
- Si es epífita (orquídea, tillandsia, bromelia) → wateringMode="mist", frequency 2-4 días.
- Caso contrario → wateringMode="soil". Frecuencia según especie: suculentas 14-21 d, tropicales 5-7 d, aromáticas 2-3 d.

Devolvé SIEMPRE el objeto completo con todos los campos, en español rioplatense para la descripción.`

export type IdentifyResult =
  | { ok: true; identification: PlantIdentification }
  | { ok: false; error: string }

export async function identifyPlantAction(
  imageDataUrl: string,
): Promise<IdentifyResult> {
  // 1) Validación básica del input.
  if (!imageDataUrl?.startsWith("data:image/")) {
    return { ok: false, error: "La imagen no es válida." }
  }

  // 2) Llamada al modelo de visión vía Vercel AI Gateway (zero config para Google).
  try {
    const { output } = await generateText({
      model: "google/gemini-3-flash",
      system: SYSTEM_PROMPT,
      output: Output.object({ schema: IdentificationSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identificá la planta de esta foto. Si no hay una planta, marcá isPlant=false.",
            },
            { type: "image", image: imageDataUrl },
          ],
        },
      ],
    })

    if (!output.isPlant) {
      return {
        ok: false,
        error:
          "No detecté una planta en la foto. Probá con mejor luz y enfocando hojas o tallos.",
      }
    }

    // 3) Removemos el flag interno antes de devolver al front.
    const { isPlant, ...identification } = output
    void isPlant
    return { ok: true, identification }
  } catch (error) {
    console.error("[v0] Error identificando planta:", error)
    return {
      ok: false,
      error:
        "El agente botánico no respondió a tiempo. Probá de nuevo en unos segundos.",
    }
  }
}
