"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Download, Share2, Sparkles, UploadCloud } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type ScanResult = {
  bioAge: number;
  difference: number;
  biomarkers: Record<string, number>;
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

type FutureImages = {
  sinProtocoloUrl: string;
  conProtocoloUrl: string;
};

const biomarkerLabels: Record<string, string> = {
  piel: "Piel",
  ojos: "Ojos",
  vitalidad: "Vitalidad",
  sonrisa: "Sonrisa",
  cabello: "Cabello",
  postura: "Postura",
  hidratacion: "Hidratación",
  tension: "Tensión",
};

const recommendationCategoryMeta: Record<
  string,
  { icon: string; label: string; classes: string }
> = {
  ejercicio: { icon: "🏃", label: "Ejercicio", classes: "border-[#00E676]/35 bg-[#00E676]/10" },
  nutricion: { icon: "🥗", label: "Nutrición", classes: "border-[#FF8C00]/35 bg-[#FF8C00]/10" },
  luz_solar: { icon: "☀️", label: "Luz solar", classes: "border-[#FFD700]/35 bg-[#FFD700]/10" },
  respiracion: { icon: "🫁", label: "Respiración", classes: "border-sky-400/35 bg-sky-400/10" },
  sueno: { icon: "😴", label: "Sueño", classes: "border-[#7F77DD]/35 bg-[#7F77DD]/10" },
  masaje: { icon: "💆", label: "Masaje", classes: "border-pink-300/35 bg-pink-300/10" },
  meditacion: { icon: "🧘", label: "Meditación", classes: "border-indigo-400/35 bg-indigo-400/10" },
  libro: { icon: "📚", label: "Libro", classes: "border-amber-300/35 bg-amber-300/10" },
  habitos: { icon: "🌱", label: "Hábitos", classes: "border-emerald-300/35 bg-emerald-300/10" },
  audio_erior: {
    icon: "🎧",
    label: "Mental Tech ERIORCENTER",
    classes: "border-violet-700/60 bg-violet-950/60",
  },
};

function normalizeCategory(category: string) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function biomarkerColor(score: number) {
  if (score <= 40) return "#FF4444";
  if (score <= 60) return "#FF8C00";
  if (score <= 75) return "#FFD700";
  if (score <= 90) return "#00E676";
  return "#7F77DD";
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer la imagen."));
        return;
      }
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Error leyendo la imagen."));
    reader.readAsDataURL(file);
  });
}

function CircularBiomarker({ label, value }: { label: string; value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const offset = circumference - (progress / 100) * circumference;
  const strokeColor = biomarkerColor(progress);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
      <div className="mx-auto flex w-fit items-center justify-center">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          <motion.circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1 }}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <span className="absolute text-sm font-semibold" style={{ color: strokeColor }}>
          {progress}
        </span>
      </div>
      <p className="mt-2 text-xs text-white/80">{label}</p>
    </div>
  );
}

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [displayAge, setDisplayAge] = useState(0);
  const [preScanReady, setPreScanReady] = useState(false);
  const [howFeelToday, setHowFeelToday] = useState(6);
  const [sleepLastNight, setSleepLastNight] = useState("bien");
  const [stressToday, setStressToday] = useState("medio");
  const [improveToday, setImproveToday] = useState("");
  const [futureImages, setFutureImages] = useState<FutureImages | null>(null);
  const [isGeneratingFutureImages, setIsGeneratingFutureImages] = useState(false);
  const [futureImagesError, setFutureImagesError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Usuario ERIORCENTER");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!result) return;
    let current = 0;
    const target = Math.max(0, Math.round(result.bioAge));
    const timer = setInterval(() => {
      current += 1;
      setDisplayAge(current);
      if (current >= target) {
        clearInterval(timer);
      }
    }, 24);
    return () => clearInterval(timer);
  }, [result]);

  useEffect(() => {
    let active = true;

    async function loadUserName() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active || !user) return;
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email?.split("@")[0];
        if (fullName) setUserName(fullName);
      } catch {
        // fallback al nombre por defecto
      }
    }

    void loadUserName();
    return () => {
      active = false;
    };
  }, []);

  const diffText = useMemo(() => {
    if (!result) return "";
    if (result.difference === 0) return "Estás en equilibrio con tu edad real";
    if (result.difference < 0) return `${Math.abs(result.difference)} años más joven que tu edad real`;
    return `${result.difference} años mayor que tu edad real`;
  }, [result]);

  const isFutureGenerationDone = useMemo(() => {
    if (!result?.simulacionFuturo) return true;
    return Boolean(futureImages || futureImagesError);
  }, [result, futureImages, futureImagesError]);

  const canDownloadPlan =
    Boolean(result) && !isScanning && !isGeneratingFutureImages && isFutureGenerationDone;

  function validateAndSetFile(nextFile: File | null) {
    if (!nextFile) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(nextFile.type)) {
      setError("Formato no válido. Usa JPG, PNG o WEBP.");
      return;
    }
    setError(null);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setResult(null);
    setDisplayAge(0);
    setFutureImages(null);
    setFutureImagesError(null);
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    validateAndSetFile(event.target.files?.[0] ?? null);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSetFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function runScan() {
    if (!file) {
      setError("Sube una selfie antes de iniciar el análisis.");
      return;
    }

    setError(null);
    setIsScanning(true);
    setResult(null);
    setFutureImages(null);
    setFutureImagesError(null);
    try {
      const base64 = await toBase64(file);
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoBase64: base64,
          mimeType: file.type,
          howFeelToday,
          sleepLastNight,
          stressToday,
          improveToday,
        }),
      });

      const payload = (await response.json()) as ScanResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo completar el escaneo.");
      }
      setResult(payload);

      if (payload.simulacionFuturo) {
        setIsGeneratingFutureImages(true);
        try {
          const futureResponse = await fetch("/api/future-images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              photoBase64: base64,
              mimeType: file.type,
              simulacionFuturo: payload.simulacionFuturo,
            }),
          });

          const futurePayload = (await futureResponse.json()) as
            | FutureImages
            | { error?: string };

          if (!futureResponse.ok) {
            throw new Error(
              "error" in futurePayload
                ? futurePayload.error ?? "No se pudieron generar imágenes del futuro."
                : "No se pudieron generar imágenes del futuro."
            );
          }

          setFutureImages(futurePayload as FutureImages);
        } catch (futureError) {
          setFutureImagesError(
            futureError instanceof Error
              ? futureError.message
              : "No se pudieron generar las imágenes de simulación."
          );
        } finally {
          setIsGeneratingFutureImages(false);
        }
      }
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Error inesperado.");
    } finally {
      setIsScanning(false);
    }
  }

  async function shareResult() {
    if (!result) return;
    const text = `Mi BioAge en ERIORCENTER es ${result.bioAge}. ${diffText}.`;
    if (navigator.share) {
      await navigator.share({
        title: "Mi resultado BioAge",
        text,
      });
      return;
    }
    await navigator.clipboard.writeText(text);
    setError("Resultado copiado al portapapeles.");
  }

  function whatsappHref(message: string) {
    return `https://wa.me/5214432311761?text=${encodeURIComponent(message)}`;
  }

  async function downloadPlanPdf() {
    if (!result || !canDownloadPlan) return;

    setIsGeneratingPdf(true);
    setError(null);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 14;
      const textWidth = pageWidth - margin * 2;
      const today = new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let y = 20;
      const ensureSpace = (needed = 12) => {
        if (y + needed <= pageHeight - 16) return;
        doc.addPage();
        y = 20;
      };

      const sectionTitle = (title: string) => {
        ensureSpace(12);
        doc.setFillColor(20, 20, 30);
        doc.rect(margin, y - 5, textWidth, 8, "F");
        doc.setTextColor(127, 119, 221);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title, margin + 2, y);
        y += 8;
      };

      const blockText = (label: string, value: string) => {
        const safe = value?.trim() ? value : "Sin dato";
        ensureSpace(10);
        doc.setTextColor(230, 230, 235);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(safe, textWidth) as string[];
        ensureSpace(lines.length * 4 + 3);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      };

      doc.setFillColor(8, 8, 12);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFillColor(127, 119, 221);
      doc.rect(0, 0, pageWidth, 24, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("ERIORCENTER | Protocolo BioAge", margin, 11);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Documento de seguimiento personalizado", margin, 17);

      y = 32;
      doc.setTextColor(235, 235, 240);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Paciente: ${userName}`, margin, y);
      doc.text(`Fecha: ${today}`, pageWidth - margin, y, { align: "right" });
      y += 8;
      doc.setDrawColor(127, 119, 221);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      sectionTitle("Resultado BioAge");
      blockText("Edad biológica estimada:", `${Math.round(result.bioAge)} años`);
      blockText("Comparativo con edad cronológica:", diffText);

      sectionTitle("Biomarcadores");
      const biomarkersText = Object.entries(biomarkerLabels)
        .map(([key, label]) => `${label}: ${result.biomarkers[key] ?? 0}/100`)
        .join(" | ");
      blockText("Panel visual:", biomarkersText);

      sectionTitle("Recomendaciones personalizadas");
      result.recomendaciones.forEach((item, index) => {
        blockText(`${index + 1}. ${item.titulo} (${item.prioridad})`, item.descripcion);
      });

      if (result.rutinaMatutina) {
        sectionTitle("Rutina matutina");
        blockText("Objetivo:", result.rutinaMatutina.descripcion);
        result.rutinaMatutina.pasos.forEach((paso, index) => {
          blockText(`Paso ${index + 1}:`, paso);
        });
      }

      sectionTitle("Protocolo de 21 días");
      const protocolo21 = [
        "Días 1-7: enfoque en hidratación, regulación de sueño y respiración diaria (10 min).",
        "Días 8-14: sumar entrenamiento de fuerza/caminata, nutrición antiinflamatoria y exposición solar matutina.",
        "Días 15-21: consolidar hábitos, integrar meditación + audio ERIORCENTER y repetir escaneo de control.",
      ];
      protocolo21.forEach((line, idx) => blockText(`Fase ${idx + 1}`, line));

      blockText(
        "Nota clínica ERIORCENTER",
        "Este plan es una guía de bienestar integral basada en análisis de IA y hábitos de longevidad. No sustituye valoración médica presencial."
      );

      const safeName = userName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "usuario";
      doc.save(`Plan_BioAge_${safeName}.pdf`);
    } catch {
      setError("No se pudo generar el PDF de tu plan.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      {!preScanReady ? (
        <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-8">
          <h1 className="text-3xl font-semibold">Chequeo previo al escaneo</h1>
          <p className="mt-2 text-sm text-white/75">
            Responde estas preguntas rápidas para que Alicia personalice mejor el análisis.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/80">¿Cómo te sientes hoy? {howFeelToday}/10</label>
              <input
                type="range"
                min={1}
                max={10}
                value={howFeelToday}
                onChange={(event) => setHowFeelToday(Number(event.target.value))}
                className="neo-input w-full accent-accent"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/80">¿Cómo dormiste anoche?</label>
              <select
                value={sleepLastNight}
                onChange={(event) => setSleepLastNight(event.target.value)}
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm"
              >
                <option value="muy bien">Muy bien</option>
                <option value="bien">Bien</option>
                <option value="regular">Regular</option>
                <option value="mal">Mal</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/80">¿Nivel de estrés hoy?</label>
              <select
                value={stressToday}
                onChange={(event) => setStressToday(event.target.value)}
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm"
              >
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/80">
                ¿Algo específico que quieras mejorar hoy? (opcional)
              </label>
              <textarea
                value={improveToday}
                onChange={(event) => setImproveToday(event.target.value)}
                className="neo-input min-h-24 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm"
                placeholder="Ejemplo: energía por las mañanas, ojeras, tensión en cuello..."
              />
            </div>
            <button
              type="button"
              onClick={() => setPreScanReady(true)}
              className="neo-button w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Continuar al escaneo
            </button>
          </div>
        </article>
      ) : (
        <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-8">
          <h1 className="text-3xl font-semibold">Escaneo BioAge</h1>
          <p className="mt-2 text-sm text-white/75">
            Sube una selfie frontal con buena luz. Alicia analizará tu campo energético y señales visibles de vitalidad.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <label
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              "relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-black/30 p-4 transition",
              isDragging ? "border-accent bg-accent/10" : "border-white/25"
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileInput}
            />
            {preview ? (
              <Image
                src={preview}
                alt="Selfie para escaneo"
                fill
                className="rounded-2xl object-cover"
              />
            ) : (
              <div className="z-10 text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-accent" />
                <p className="mt-3 text-sm font-semibold">Arrastra tu selfie aquí</p>
                <p className="mt-1 text-xs text-white/60">JPG, PNG o WEBP</p>
              </div>
            )}

            {isScanning ? (
              <div className="absolute inset-0 overflow-hidden rounded-2xl bg-black/55">
                <motion.div
                  className="absolute inset-x-0 h-1 bg-accent/90"
                  animate={{ y: [0, 280, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-x-0 h-px bg-accent/70"
                  animate={{ y: [40, 300, 40] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-x-4 bottom-4 rounded-xl border border-accent/30 bg-black/65 p-3 text-xs text-accent">
                  Alicia analizando tu campo energético...
                </div>
              </div>
            ) : null}
          </label>

          <div className="glass-card space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <h2 className="text-lg font-semibold">Opciones de captura</h2>
            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10">
              <Camera className="h-4 w-4 text-accent" />
              Tomar foto con cámara
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
        
                className="hidden"
                onChange={onFileInput}
              />
            </label>
            <button
              type="button"
              onClick={runScan}
              disabled={!file || isScanning}
              className="neo-button w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(127,119,221,0.45)] transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isScanning ? "Analizando..." : "Iniciar análisis con Alicia"}
            </button>
            <p className="text-xs text-white/60">
              Consejo: mira a la cámara, evita filtros y mantén expresión neutra.
            </p>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        </article>
      )}

      {result ? (
        <section className="space-y-6">
          <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-white/70">Tu BioAge estimada</p>
                <motion.p
                  key={result.bioAge}
                  initial={{ scale: 0.9, opacity: 0.2 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-semibold"
                >
                  {displayAge}
                </motion.p>
              </div>
              <div className="rounded-full border border-accent/50 bg-accent/20 px-4 py-2 text-sm font-semibold text-accent">
                {diffText}
              </div>
            </div>
          </article>

          <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="text-xl font-semibold">Biomarcadores visuales</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(biomarkerLabels).map(([key, label]) => (
                <CircularBiomarker key={key} label={label} value={result.biomarkers[key] ?? 0} />
              ))}
            </div>
            <div className="mt-6 h-72 rounded-2xl border border-white/10 bg-black/30 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={Object.entries(biomarkerLabels).map(([key, label]) => ({
                    biomarcador: label,
                    score: result.biomarkers[key] ?? 0,
                  }))}
                >
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="biomarcador" stroke="rgba(255,255,255,0.75)" />
                  <PolarRadiusAxis domain={[0, 100]} stroke="rgba(255,255,255,0.35)" />
                  <Radar
                    name="Biomarcadores"
                    dataKey="score"
                    stroke="#7F77DD"
                    fill="#7F77DD"
                    fillOpacity={0.32}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-xl font-semibold">Resumen de Alicia</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/85">{result.resumenAlicia}</p>
          </article>

          <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="text-xl font-semibold">Recomendaciones personalizadas</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {result.recomendaciones.map((item) => {
                const normalized = normalizeCategory(item.categoria);
                const categoryMeta = recommendationCategoryMeta[normalized];
                const isAudio = normalized === "audio_erior";
                return (
                  <div
                    key={`${item.titulo}-${item.categoria}`}
                    className={cn(
                      "rounded-2xl border p-4",
                      categoryMeta?.classes ?? "border-white/10 bg-black/35",
                      isAudio && "shadow-[0_0_28px_rgba(127,119,221,0.3)]"
                    )}
                  >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.titulo}</p>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/85">
                      {categoryMeta?.icon ?? "✨"} {categoryMeta?.label ?? item.categoria}
                    </span>
                    <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-xs text-accent">
                      {item.prioridad}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/80">{item.descripcion}</p>
                  {isAudio && item.whatsappMsg ? (
                    <a
                      href={whatsappHref(item.whatsappMsg)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-[#7F77DD] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#7F77DD]/90"
                    >
                      Ver en WhatsApp →
                    </a>
                  ) : null}
                  </div>
                );
              })}
            </div>
          </article>

          {result.rutinaMatutina ? (
            <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-xl font-semibold">Rutina Matutina</h3>
              <p className="mt-2 text-sm text-white/75">{result.rutinaMatutina.descripcion}</p>
              <div className="mt-4 space-y-3">
                {result.rutinaMatutina.pasos.map((paso, idx) => (
                  <div key={`${paso}-${idx}`} className="relative pl-8">
                    <div className="absolute top-1 left-2 h-full w-px bg-white/15" />
                    <div className="absolute top-1.5 left-0 h-4 w-4 rounded-full border border-accent/70 bg-accent/20" />
                    <p className="text-sm text-white/85">{paso}</p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {result.simulacionFuturo ? (
            <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-xl font-semibold">Simulación de futuro</h3>
              <div className="mt-4 rounded-2xl border border-accent/40 bg-gradient-to-r from-[#7F77DD]/35 via-[#7F77DD]/20 to-black/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/50 bg-black/30 text-3xl">
                    🧍
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">🔮 Así te verías...</p>
                    <p className="text-xs text-white/75">
                      Visualización fotorrealista con IA generativa — próximamente
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-red-500/30 bg-red-950/35 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">
                    Sin protocolo BioAge
                  </p>
                  {futureImages?.sinProtocoloUrl ? (
                    <div className="relative h-64 w-full overflow-hidden rounded-xl sm:h-72">
                      <Image
                        src={futureImages.sinProtocoloUrl}
                        alt="Yo futuro sin protocolo BioAge"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-white/10 bg-black/35 text-xs text-white/65 sm:h-72">
                      {isGeneratingFutureImages
                        ? "Generando visualización envejecida..."
                        : "Imagen fotorrealista pendiente"}
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    Con protocolo BioAge
                  </p>
                  {futureImages?.conProtocoloUrl ? (
                    <div className="relative h-64 w-full overflow-hidden rounded-xl sm:h-72">
                      <Image
                        src={futureImages.conProtocoloUrl}
                        alt="Yo futuro con protocolo BioAge"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-white/10 bg-black/35 text-xs text-white/65 sm:h-72">
                      {isGeneratingFutureImages
                        ? "Generando visualización rejuvenecida..."
                        : "Imagen fotorrealista pendiente"}
                    </div>
                  )}
                </div>
              </div>
              {futureImagesError ? (
                <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {futureImagesError}
                </p>
              ) : null}
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4">
                  <h4 className="font-semibold text-red-300">Sin protocolo</h4>
                  <p className="mt-2 text-sm text-white/80">
                    <span className="font-semibold">5 años:</span>{" "}
                    {result.simulacionFuturo.sin_protocolo_5años}
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    <span className="font-semibold">10 años:</span>{" "}
                    {result.simulacionFuturo.sin_protocolo_10años}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/35 p-4">
                  <h4 className="font-semibold text-emerald-300">Con protocolo BioAge</h4>
                  <p className="mt-2 text-sm text-white/80">
                    <span className="font-semibold">5 años:</span>{" "}
                    {result.simulacionFuturo.con_protocolo_5años}
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    <span className="font-semibold">10 años:</span>{" "}
                    {result.simulacionFuturo.con_protocolo_10años}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/60">
                Visualización con IA generativa próximamente disponible
              </p>
            </article>
          ) : null}

          {result.fraseAlicia ? (
            <article className="glass-card rounded-3xl border border-accent/40 bg-gradient-to-br from-[#7F77DD]/40 via-[#7F77DD]/20 to-black/40 p-6 backdrop-blur-xl">
              <p className="text-lg leading-relaxed font-medium italic text-white sm:text-xl">
                {result.fraseAlicia}
              </p>
            </article>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {canDownloadPlan ? (
              <button
                type="button"
                onClick={downloadPlanPdf}
                disabled={isGeneratingPdf}
                className="neo-button inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPdf ? "Generando PDF..." : "Descargar mi plan"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={shareResult}
              className="neo-button inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 text-accent" />
              Compartir resultado
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
