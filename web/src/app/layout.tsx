import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ISPT-Bukavu — Institut Supérieur Pédagogique et Technique de Bukavu",
    template: "%s · ISPT-Bukavu",
  },
  description:
    "Établissement public d'enseignement supérieur à Bukavu : Génie Civil, Électricité, Électronique et Informatique, Mécanique.",
  applicationName: "ISPT-Bukavu",
};

export const viewport: Viewport = {
  themeColor: "#1f2a6b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
