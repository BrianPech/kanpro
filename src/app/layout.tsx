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
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function showBanner(titleText, messageText, isWarn) {
                var errorDiv = document.getElementById('global-error-banner');
                if (!errorDiv) {
                  errorDiv = document.createElement('div');
                  errorDiv.id = 'global-error-banner';
                  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: ' + (isWarn ? '#f59e0b' : '#dc2626') + '; color: white; padding: 16px; z-index: 99999; font-family: monospace; font-size: 11px; max-height: 60vh; overflow-y: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.5); word-break: break-all;';
                  var closeBtn = document.createElement('button');
                  closeBtn.innerText = 'Cerrar';
                  closeBtn.style.cssText = 'float: right; background: white; color: black; border: none; padding: 4px 8px; font-weight: bold; cursor: pointer; border-radius: 4px;';
                  closeBtn.onclick = function() { errorDiv.style.display = 'none'; };
                  errorDiv.appendChild(closeBtn);
                  var title = document.createElement('h3');
                  title.id = 'global-error-title';
                  title.style.margin = '0 0 8px 0';
                  title.style.fontSize = '13px';
                  errorDiv.appendChild(title);
                  var msg = document.createElement('pre');
                  msg.id = 'global-error-msg';
                  msg.style.margin = '0';
                  msg.style.whiteSpace = 'pre-wrap';
                  errorDiv.appendChild(msg);
                  document.body.appendChild(errorDiv);
                }
                document.getElementById('global-error-title').innerText = titleText;
                var msgPre = document.getElementById('global-error-msg');
                if (msgPre) {
                  msgPre.innerText += '\\n' + messageText + '\\n';
                }
              }

              // Catch runtime errors
              window.addEventListener('error', function(event) {
                if (event.filename) {
                  showBanner('❌ Error de JavaScript:', event.message + '\\nArchivo: ' + event.filename + '\\nLínea: ' + event.lineno + ':' + event.colno);
                } else if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                  showBanner('❌ Error de Recurso (Script/CSS):', 'Fallo al cargar: ' + (event.target.src || event.target.href), false);
                }
              }, true); // useCapture = true to catch resource load errors

              // Catch unhandled promise rejections
              window.addEventListener('unhandledrejection', function(event) {
                showBanner('⚠️ Promesa Rechazada:', 'Reason: ' + event.reason, false);
              });

              // Intercept console.error to catch React hydration warnings
              var originalConsoleError = console.error;
              console.error = function() {
                var args = Array.prototype.slice.call(arguments);
                originalConsoleError.apply(console, args);
                showBanner('❌ console.error detectado:', args.join(' '), false);
              };
            `
          }}
        />
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
