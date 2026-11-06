import { cn } from "@/lib/cn";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { EnregistrementServiceWorker } from "@/components/pwa/service-worker";
import { AnimationsDefilement } from "@/components/mouvement/animations-defilement";
import { MODE_DEMO } from "@/lib/demo";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ispt-bukavu.vercel.app"),
  title: {
    default: "ISPT-Bukavu — Institut Supérieur Pédagogique et Technique de Bukavu",
    template: "%s · ISPT-Bukavu",
  },
  description:
    "Établissement public d'enseignement supérieur à Bukavu. Formation d'ingénieurs en Électromécanique, Génie Informatique, Électronique et Télécommunications, et Génie Civil.",
  applicationName: "ISPT-Bukavu",
  // Aperçu des liens partagés (WhatsApp, Facebook…) ; l'image vient de opengraph-image.tsx.
  openGraph: {
    type: "website",
    locale: "fr_CD",
    siteName: "ISPT-Bukavu",
  },
  twitter: { card: "summary_large_image" },
  ...(MODE_DEMO ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#141b4a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={cn(
        plexSans.variable,
        plexMono.variable,
        newsreader.variable,
        "h-full antialiased",
        MODE_DEMO && "mode-demo",
      )}
      suppressHydrationWarning
    >
      <head>
        <script
          // Active les animations seulement si JavaScript s'exécute.
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {MODE_DEMO && (
          // Hauteur fixe (--bandeau-demo) : les écrans à hauteur d'écran en tiennent compte.
          <p className="flex h-(--bandeau-demo) items-center justify-center overflow-hidden bg-chantier px-4 text-center text-sm leading-tight font-medium text-encre">
            Version de démonstration : toutes les données sont fictives et réinitialisées chaque
            nuit.
          </p>
        )}
        {children}
        <AnimationsDefilement />
        <EnregistrementServiceWorker />
      </body>
    </html>
  );
}
