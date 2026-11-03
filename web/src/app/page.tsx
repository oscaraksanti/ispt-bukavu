import Image from "next/image";

const contacts = [
  { label: "Adresse", value: "Avenue de l'Hippodrome n°102, Nyawera, Ibanda — Bukavu" },
  { label: "Téléphone", value: "+243 999 249 630", href: "tel:+243999249630" },
  { label: "WhatsApp", value: "+243 853 715 883", href: "https://wa.me/243853715883" },
  { label: "Email", value: "ispt.bk@gmail.com", href: "mailto:ispt.bk@gmail.com" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
      <div className="flex items-center gap-4">
        <Image
          src="/brand/logo-master.png"
          alt="Blason de l'ISPT-Bukavu"
          width={64}
          height={64}
          priority
          className="rounded-lg bg-white ring-1 ring-ink/10"
        />
        <p className="text-sm font-medium tracking-wide text-ispt-blue uppercase">
          Institut Supérieur Pédagogique et Technique de Bukavu
        </p>
      </div>

      <h1 className="mt-10 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
        Une nouvelle plateforme numérique se prépare.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
        Communiqués officiels, inscriptions, cours, résultats et services aux étudiants : bientôt
        réunis au même endroit, accessibles depuis un téléphone.
      </p>

      <dl className="mt-14 grid gap-6 border-t border-ink/10 pt-8 sm:grid-cols-2">
        {contacts.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-medium tracking-wide text-ink/55 uppercase">
              {item.label}
            </dt>
            <dd className="mt-1 text-base">
              {item.href ? (
                <a
                  href={item.href}
                  className="underline decoration-ink/25 underline-offset-4 hover:decoration-ispt-blue"
                >
                  {item.value}
                </a>
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
