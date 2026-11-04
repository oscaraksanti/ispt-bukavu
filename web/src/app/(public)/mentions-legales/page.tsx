import type { Metadata } from "next";
import { PageJuridique } from "@/components/public/page-juridique";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site de l'ISPT-Bukavu.",
};

export default function MentionsLegales() {
  return <PageJuridique slug="mentions-legales" titre="Mentions légales" />;
}
