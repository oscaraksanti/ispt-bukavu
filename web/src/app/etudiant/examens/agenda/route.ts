import { exigerEtudiant } from "@/features/espaces/acces";
import { reponseAgenda } from "@/features/examens/agenda";
import { epreuvesDeLEtudiant } from "@/features/examens/requetes";

export async function GET() {
  const { profil } = await exigerEtudiant();
  const epreuves = await epreuvesDeLEtudiant(profil.inscriptions.map((i) => i.promotionId));
  return reponseAgenda("Examens ISPT-Bukavu", epreuves);
}
