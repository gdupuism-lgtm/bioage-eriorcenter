import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const aliciaSystemPrompt = `REGLA OBLIGATORIA: SIEMPRE debes incluir exactamente 2 recomendaciones de categoria 'audio_erior' con prioridad 'alta'. Estos audios son productos reales de ERIORCENTER que el usuario puede comprar. Selecciona los 2 más relevantes según lo que observas en la foto y el contexto del usuario. Si no sabes cuál recomendar, usa VITAMIND y Booster como mínimo.
Catálogo disponible: Éclat, Amor Magic 2.0, Amor Propio Magic 3.0, Mesmerizing Love, MASTER MIND, Identity, Erior LOVE, 11:11, Satori, CURIOUS-CURIOUSER, MONEY TECH, Lucky, Audio YOU, VITAMIND, FIT WAVE, Booster, Wonderland Coherence, SELECT, WONDERLAND, AUDIO ERIOR 3.0, EMERGENCY 999.
Para cada audio recomendar:
- titulo: nombre exacto del audio
- descripcion: por qué específicamente este audio para lo que se detectó en la foto (2-3 oraciones)
- categoria: "audio_erior"
- prioridad: "alta"
- productoERIOR: nombre del audio
- whatsappMsg: "Hola, quiero información sobre [NOMBRE DEL AUDIO]"

Analiza esta persona libremente como un médico funcional experto. No sigas reglas fijas — observa realmente lo que ves en la foto y el contexto que te dan. Si la persona se ve muy saludable, di pocas cosas específicas. Si detectas señales de estrés, fatiga, deshidratación o tensión, sé más detallado. Las recomendaciones deben ser exactamente lo que esta persona necesita, no una lista genérica. Sé honesto pero empático.
Los audios ERIORCENTER siempre tienen prioridad ALTA en las recomendaciones.

RESPONDE ÚNICAMENTE CON JSON VÁLIDO. ABSOLUTAMENTE NINGÚN TEXTO ANTES O DESPUÉS DEL JSON. NI EXPLICACIONES, NI MARKDOWN, NI BACKTICKS.

Devuelve exactamente este JSON:
{
  bioAge: number,
  difference: number,
  biomarkers: {
    piel: number 0-100,
    ojos: number 0-100,
    vitalidad: number 0-100,
    sonrisa: number 0-100,
    cabello: number 0-100,
    postura: number 0-100,
    hidratacion: number 0-100,
    tension: number 0-100
  },
  resumenAlicia: string (3-4 oraciones personales y empáticas, como si Alicia conociera a la persona),
  fraseAlicia: string (frase poética y poderosa de 2-3 líneas, única para esta persona),
  rutinaMatutina: {
    descripcion: string,
    pasos: [string]
  },
  recomendaciones: [
    {
      categoria: string (ejercicio|nutricion|sueno|respiracion|luz_solar|masaje|meditacion|libro|habitos|audio_erior),
      titulo: string,
      descripcion: string (detallada, con horarios, días, duración exacta),
      prioridad: string (alta|media|baja),
      productoERIOR: string|null,
      whatsappMsg: string|null
    }
  ]
  simulacionFuturo: {
    sin_protocolo_5años: string,
    sin_protocolo_10años: string,
    con_protocolo_5años: string,
    con_protocolo_10años: string
  }
}
`;

type ScanResult = {
  bioAge: number;
  difference: number;
  biomarkers: {
    piel: number;
    ojos: number;
    vitalidad: number;
    sonrisa: number;
    cabello: number;
    postura: number;
    hidratacion: number;
    tension: number;
  };
  resumenAlicia: string;
  fraseAlicia?: string;
  rutinaMatutina?: {
    descripcion: string;
    pasos: string[];
  };
  simulacionFuturo?: {
    sin_protocolo_5años: string;
    sin_protocolo_10años: string;
    con_protocolo_5años: string;
    con_protocolo_10años: string;
  };
  recomendaciones: Array<{
    titulo: string;
    descripcion: string;
    categoria: string;
    prioridad: string;
    productoERIOR: string | null;
    whatsappMsg: string | null;
  }>;
};

const eriorAudioCatalog = new Set([
  "Éclat",
  "Amor Magic 2.0",
  "Amor Propio Magic 3.0",
  "Mesmerizing Love",
  "MASTER MIND",
  "Identity",
  "Erior LOVE",
  "11:11",
  "Satori",
  "CURIOUS-CURIOUSER",
  "MONEY TECH",
  "Lucky",
  "Audio YOU",
  "VITAMIND",
  "FIT WAVE",
  "Booster",
  "Wonderland Coherence",
  "SELECT",
  "WONDERLAND",
  "AUDIO ERIOR 3.0",
  "EMERGENCY 999",
]);

function normalizeAudioTitle(rawTitle: string) {
  const cleaned = rawTitle
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+\s*hz\b/gi, " ")
    .replace(/\b\d+hz\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (eriorAudioCatalog.has(cleaned)) return cleaned;
  const byContains = Array.from(eriorAudioCatalog).find(
    (name) =>
      cleaned.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(cleaned.toLowerCase())
  );
  return byContains ?? null;
}

function normalizeRecommendations(items: ScanResult["recomendaciones"]) {
  const normalized: ScanResult["recomendaciones"] = [];

  for (const item of items) {
    const category = item.categoria
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (category === "audio_erior") {
      const normalizedTitle = normalizeAudioTitle(item.titulo);
      if (!normalizedTitle) continue;
      normalized.push({
        ...item,
        titulo: normalizedTitle,
        productoERIOR: normalizedTitle,
        prioridad: "alta",
      });
      continue;
    }

    normalized.push(item);
  }

  return normalized;
}

function enforceAudioRecommendations(recommendations: ScanResult["recomendaciones"]) {
  const nonAudio = recommendations.filter(
    (item) =>
      item.categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() !==
      "audio_erior"
  );
  const audio = recommendations.filter(
    (item) =>
      item.categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
      "audio_erior"
  );

  const uniqueAudio = audio.filter(
    (item, index, arr) =>
      arr.findIndex((x) => x.titulo.toLowerCase() === item.titulo.toLowerCase()) === index
  );

  const resultAudio = [...uniqueAudio];
  if (resultAudio.length < 2) {
    const fallbacks = ["VITAMIND", "Booster"];
    for (const fallback of fallbacks) {
      if (resultAudio.length >= 2) break;
      const alreadyIncluded = resultAudio.some(
        (item) => item.titulo.toLowerCase() === fallback.toLowerCase()
      );
      if (alreadyIncluded) continue;
      resultAudio.push({
        titulo: fallback,
        descripcion:
          fallback === "VITAMIND"
            ? "Recomendado para fortalecer vitalidad, recuperación física y sistema inmune según tu estado actual."
            : "Recomendado para reset mental y regulación del sistema nervioso en contextos de tensión.",
        categoria: "audio_erior",
        prioridad: "alta",
        productoERIOR: fallback,
        whatsappMsg: `Hola, quiero información sobre ${fallback}`,
      });
    }
  }

  return [...nonAudio, ...resultAudio.slice(0, 2)];
}

function parseJsonResponse(text: string): ScanResult {
  const cleanJson = (str: string) => {
    const start = str.indexOf("{");
    const end = str.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found");
    let json = str.substring(start, end + 1);
    json = json
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\u00a0/g, " ")
      .replace(/\u2028|\u2029/g, " ");
    json = json.replace(/,(\s*[}\]])/g, "$1");
    return json;
  };

  let parsed: ScanResult;
  try {
    parsed = JSON.parse(text) as ScanResult;
  } catch (error) {
    try {
      const jsonStr = cleanJson(text);
      parsed = JSON.parse(jsonStr) as ScanResult;
    } catch (fallbackError) {
      const detail =
        fallbackError instanceof Error
          ? fallbackError.message
          : error instanceof Error
            ? error.message
            : "Error desconocido al parsear JSON.";
      throw new Error(`No se pudo interpretar la respuesta como JSON. Detalle: ${detail}`);
    }
  }

  if (
    typeof parsed.bioAge !== "number" ||
    typeof parsed.difference !== "number" ||
    typeof parsed.resumenAlicia !== "string" ||
    typeof parsed.biomarkers !== "object" ||
    !Array.isArray(parsed.recomendaciones)
  ) {
    throw new Error("JSON de Claude incompleto.");
  }

  if (!parsed.rutinaMatutina || !Array.isArray(parsed.rutinaMatutina.pasos)) {
    parsed.rutinaMatutina = {
      descripcion: "Rutina matutina base para activar energía y enfoque.",
      pasos: [
        "06:30 - Agua con limón y pizca de sal rosa (5 min)",
        "06:40 - Movilidad + respiración consciente (10 min)",
        "07:00 - Sol directo y caminata ligera (15 min)",
      ],
    };
  }

  return parsed;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    let chronologicalAge = 30;
    let profileGoal: string | null = null;
    let profileGender: string | null = null;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        chronologicalAge =
          typeof profile.chronological_age === "number" ? profile.chronological_age : 30;
        profileGoal =
          (typeof profile.primary_goal === "string" && profile.primary_goal) ||
          (typeof profile.goals === "string" && profile.goals) ||
          null;
        profileGender = typeof profile.gender === "string" ? profile.gender : null;
      }
    } catch {
      // Si profiles no existe o cambia de esquema, continuamos con defaults.
    }

    const body = (await request.json()) as {
      photoBase64?: string;
      mimeType?: string;
      howFeelToday?: number;
      sleepLastNight?: string;
      stressToday?: string;
      improveToday?: string;
    };

    const photoBase64 = body.photoBase64;
    const mimeType = body.mimeType;

    if (!photoBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Falta la imagen para realizar el escaneo." },
        { status: 400 }
      );
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar ANTHROPIC_API_KEY en el servidor." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: aliciaSystemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: photoBase64,
              },
            },
            {
              type: "text",
              text: `Contexto del usuario:
- Edad cronológica: ${chronologicalAge}
- Objetivo principal: ${profileGoal ?? "no definido"}
- Género: ${profileGender ?? "no definido"}
- ¿Cómo se siente hoy? ${body.howFeelToday ?? "sin dato"} /10
- ¿Cómo durmió anoche? ${body.sleepLastNight ?? "sin dato"}
- Nivel de estrés hoy: ${body.stressToday ?? "sin dato"}
- Qué quiere mejorar hoy: ${body.improveToday || "sin comentario"}

Analiza esta selfie y responde con el JSON solicitado.`,
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const parsed = parseJsonResponse(text);

    const responsePayload: ScanResult = {
      ...parsed,
      recomendaciones: enforceAudioRecommendations(
        normalizeRecommendations(parsed.recomendaciones)
      ),
    };

    const { error: saveError } = await supabase.from("scans").insert({
      user_id: user.id,
      bio_age: Math.round(responsePayload.bioAge),
      difference: Math.round(responsePayload.difference),
      biomarkers: responsePayload.biomarkers,
      resumen_alicia: responsePayload.resumenAlicia,
      recomendaciones: responsePayload.recomendaciones,
      created_at: new Date().toISOString(),
    });

    if (saveError) {
      return NextResponse.json(
        { error: "No se pudo guardar el escaneo en Supabase." },
        { status: 500 }
      );
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo completar el análisis de Alicia.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
