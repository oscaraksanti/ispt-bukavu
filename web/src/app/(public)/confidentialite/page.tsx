import type { Metadata } from "next";
import { PageJuridique } from "@/components/public/page-juridique";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Protection des données personnelles sur la plateforme de l'ISPT-Bukavu.",
};

export default function Confidentialite() {
  return <PageJuridique slug="confidentialite" titre="Confidentialité" />;
}
