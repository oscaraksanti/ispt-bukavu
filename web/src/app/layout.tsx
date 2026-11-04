import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { EnregistrementServiceWorker } from "@/components/pwa/service-worker";
import { AnimationsDefilement } from "@/components/mouvement/animations-defilement";
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
};

export const viewport: Viewport = {
  themeColor: "#141b4a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          // Active les animations seulement si JavaScript s'exécute.
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <AnimationsDefilement />
        <EnregistrementServiceWorker />
      </body>
    </html>
  );
}
