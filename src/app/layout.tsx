import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BioAge by ERIORCENTER | Edad Biológica Real con IA",
  description:
    "BioAge by ERIORCENTER es una plataforma de transformación consciente con IA para LATAM. Descubre tu edad biológica real y mejora tu bienestar integral.",
  keywords: [
    "edad biológica",
    "edad biológica real",
    "biohacking",
    "longevidad",
    "inteligencia artificial",
    "salud preventiva",
    "ERIORCENTER",
    "LATAM",
  ],
  openGraph: {
    title: "BioAge by ERIORCENTER",
    description:
      "Transformación consciente con IA para LATAM. Descubre y mejora tu edad biológica real.",
    locale: "es_MX",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BioAge ERIORCENTER" />
        <meta name="theme-color" content="#7F77DD" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
