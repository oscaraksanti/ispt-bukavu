import { exigerEnseignant } from "@/features/espaces/acces";
import { reponseAgenda } from "@/features/examens/agenda";
import { epreuvesDeLEnseignant } from "@/features/examens/requetes";

export async function GET() {
  const { profil } = await exigerEnseignant();
  return reponseAgenda("Examens ISPT-Bukavu", await epreuvesDeLEnseignant(profil.id));
}
