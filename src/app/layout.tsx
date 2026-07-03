import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "K'anPro | Vinculación Laboral Express en Riviera Maya",
    template: "%s | K'anPro"
  },
  description: "Encuentra empleo local o contrata personal verificado en Playa del Carmen y Riviera Maya en minutos. Conexión directa por WhatsApp, sin intermediarios ni comisiones.",
  keywords: ["empleo", "playa del carmen", "riviera maya", "trabajo", "contratación", "whatsapp", "reclutamiento", "personal verificado", "cv digital"],
  authors: [{ name: "K'anPro Team" }],
  openGraph: {
    title: "K'anPro | Vinculación Laboral Express en Riviera Maya",
    description: "Conectamos candidatos locales con empresas en Playa del Carmen de forma directa por WhatsApp. Sin comisiones ni intermediarios.",
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
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "K'anPro | Vinculación Laboral Express en Riviera Maya",
    description: "Vinculación laboral directa y sin fricciones por WhatsApp en Playa del Carmen.",
    images: ["https://kanpro.mx/og-image.png"],
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", manrope.variable)}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider delayDuration={0}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <Toaster richColors theme="system" />
        </TooltipProvider>
      </body>
    </html>
  );
}
