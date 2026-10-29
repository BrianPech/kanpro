import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = { variable: "font-geist-sans" };
const geistMono = { variable: "font-geist-mono" };

export const metadata: Metadata = {
  title: {
    default: "K'anPro | Vinculación Laboral Express en el Sureste de México",
    template: "%s | K'anPro",
  },
  description:
    "Encuentra empleo local o contrata personal verificado en Mérida, Playa del Carmen y la Riviera Maya en minutos. Conexión directa por WhatsApp, sin intermediarios ni comisiones.",
  keywords: [
    "empleo",
    "mérida",
    "yucatán",
    "playa del carmen",
    "riviera maya",
    "trabajo",
    "contratación",
    "whatsapp",
    "reclutamiento",
    "personal verificado",
    "cv digital",
  ],
  authors: [{ name: "K'anPro Team" }],
  openGraph: {
    title: "K'anPro | Vinculación Laboral Express en el Sureste de México",
    description:
      "Conectamos candidatos locales con empresas en Mérida y Playa del Carmen de forma directa por WhatsApp. Sin comisiones ni intermediarios.",
    url: "https://kanpro.mx",
    siteName: "K'anPro",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "https://kanpro.mx/og-image.png",
        width: 1200,
        height: 630,
        alt: "K'anPro - Conexión Laboral Directa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "K'anPro | Vinculación Laboral Express en el Sureste",
    description:
      "Vinculación laboral directa y sin fricciones por WhatsApp en Mérida y la Riviera Maya.",
    images: ["https://kanpro.mx/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WhatsAppSupportWidget } from "@/components/marketing/whatsapp-support-widget";
import { Geist } from "next/font/google";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <QueryProvider>
          <TooltipProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
            <Toaster richColors />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
