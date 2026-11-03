import Image from "next/image";
import Link from "next/link";
import { Blason, Signature } from "@/components/marque/blason";

export default function LayoutAuthentification({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-encre lg:block">
        <Image
          src="/photos/collation-2026-laureats-salle.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-35 mix-blend-luminosity"
          loading="eager"
        />
        <div className="trame-claire absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="w-fit">
            <Signature clair />
          </Link>
          <div className="max-w-md">
            <Blason variante="blanc" devise hauteur={120} />
            <p className="mt-8 font-serif text-3xl leading-snug">
              Espace numérique de l&apos;Institut Supérieur Pédagogique et Technique de Bukavu.
            </p>
            <p className="mt-4 font-mono text-xs tracking-wide text-white/70 uppercase">
              Scientia splendet et conscientia
            </p>
          </div>
        </div>
      </aside>
      <main className="flex flex-col bg-papier">
        <div className="p-6 lg:hidden">
          <Link href="/" className="inline-block">
            <Signature compacte />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="entree w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
