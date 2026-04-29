import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FutureImagesRequest = {
  photoBase64?: string;
  mimeType?: string;
  simulacionFuturo?: {
    sin_protocolo_5años?: string;
    con_protocolo_5años?: string;
  };
};

type FalImageResponse = {
  images?: Array<{ url?: string }>;
};

type FalFaceSwapResponse = {
  image?: { url?: string };
};

async function generateBaseWithFlux({
  apiKey,
  imageDataUri,
  prompt,
}: {
  apiKey: string;
  imageDataUri: string;
  prompt: string;
}) {
  const response = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageDataUri,
      prompt,
      num_images: 1,
      output_format: "jpeg",
      guidance_scale: 3.5,
      num_inference_steps: 30,
      strength: 0.82,
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`fal.ai devolvió ${response.status}. ${details}`.trim());
  }

  const payload = (await response.json()) as FalImageResponse;
  const url = payload.images?.[0]?.url;
  if (!url) {
    throw new Error("fal.ai no devolvió URL de imagen.");
  }
  return url;
}

async function applyFaceSwap({
  apiKey,
  baseImageUrl,
  sourceFaceDataUri,
}: {
  apiKey: string;
  baseImageUrl: string;
  sourceFaceDataUri: string;
}) {
  const response = await fetch("https://fal.run/fal-ai/face-swap", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base_image_url: baseImageUrl,
      swap_image_url: sourceFaceDataUri,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Face-swap devolvió ${response.status}. ${details}`.trim());
  }

  const payload = (await response.json()) as FalFaceSwapResponse;
  const url = payload.image?.url;
  if (!url) {
    throw new Error("fal-ai/face-swap no devolvió URL de imagen.");
  }
  return url;
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

    const body = (await request.json()) as FutureImagesRequest;
    const photoBase64 = body.photoBase64;
    const mimeType = body.mimeType;

    if (!photoBase64 || !mimeType) {
      return NextResponse.json({ error: "Falta la selfie en base64." }, { status: 400 });
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 });
    }

    const falApiKey = process.env.FAL_API_KEY;
    if (!falApiKey) {
      return NextResponse.json(
        { error: "Falta configurar FAL_API_KEY en el servidor." },
        { status: 500 }
      );
    }

    const imageDataUri = `data:${mimeType};base64,${photoBase64}`;

    const sinProtocoloPrompt = `same person, naturally aged 5 years, subtle crow's feet, slightly duller skin, mild forehead lines, natural fatigue, same hairstyle, same gender, photorealistic, candid natural lighting
Context: ${body.simulacionFuturo?.sin_protocolo_5años ?? "sin protocolo BioAge durante 5 años."}
Both outputs must look like real photos of the same person, not edited.`;

    const conProtocoloPrompt = `same person, same age but healthier version, glowing radiant skin, bright rested eyes, smooth firm skin, natural healthy flush, same hairstyle, same gender, photorealistic, soft natural lighting, vibrant youthful energy
Context: ${body.simulacionFuturo?.con_protocolo_5años ?? "siguiendo protocolo BioAge durante 5 años."}
Both outputs must look like real photos of the same person, not edited. no stickers, no overlays, no artifacts, no text, no markings, clean natural skin, no additions to face`;

    const [sinProtocoloBaseUrl, conProtocoloBaseUrl] = await Promise.all([
      generateBaseWithFlux({ apiKey: falApiKey, imageDataUri, prompt: sinProtocoloPrompt }),
      generateBaseWithFlux({ apiKey: falApiKey, imageDataUri, prompt: conProtocoloPrompt }),
    ]);

    // Paso final obligatorio: preservar identidad real usando fal-ai/face-swap.
    const [sinProtocoloUrl, conProtocoloUrl] = await Promise.all([
      applyFaceSwap({
        apiKey: falApiKey,
        baseImageUrl: sinProtocoloBaseUrl,
        sourceFaceDataUri: imageDataUri,
      }),
      applyFaceSwap({
        apiKey: falApiKey,
        baseImageUrl: conProtocoloBaseUrl,
        sourceFaceDataUri: imageDataUri,
      }),
    ]);

    return NextResponse.json({ sinProtocoloUrl, conProtocoloUrl });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron generar imágenes de simulación con fal.ai.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
