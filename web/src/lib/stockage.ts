import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Stockage des fichiers, indépendant du fournisseur.
 *
 * - Supabase Storage (compatible S3) en production, si SUPABASE_URL et
 *   SUPABASE_SERVICE_ROLE_KEY sont définis ;
 * - Vercel Blob en accès privé, si un magasin Blob est relié au projet
 *   (BLOB_READ_WRITE_TOKEN) : instance de démonstration ;
 * - disque local sinon (développement).
 *
 * Les fichiers sont désignés par une clé opaque ; l'application les sert via
 * la route /medias/[...cle], ce qui permet de changer de fournisseur (par
 * exemple pour un hébergement en RDC) sans modifier les données.
 */

export interface Stockage {
  enregistrer(cle: string, contenu: Buffer, typeMime: string): Promise<void>;
  lire(cle: string): Promise<{ contenu: Buffer; typeMime: string } | null>;
  supprimer(cle: string): Promise<void>;
}

const DOSSIER_LOCAL = path.join(process.cwd(), "stockage-local");

const stockageLocal: Stockage = {
  async enregistrer(cle, contenu) {
    const chemin = path.join(DOSSIER_LOCAL, cle);
    await mkdir(path.dirname(chemin), { recursive: true });
    await writeFile(chemin, contenu);
  },
  async lire(cle) {
    try {
      const contenu = await readFile(path.join(DOSSIER_LOCAL, cle));
      return { contenu, typeMime: typeMimeDepuisCle(cle) };
    } catch {
      return null;
    }
  },
  async supprimer(cle) {
    await rm(path.join(DOSSIER_LOCAL, cle), { force: true });
  },
};

function stockageSupabase(url: string, cleService: string, bucket: string): Stockage {
  const base = `${url.replace(/\/$/, "")}/storage/v1/object`;
  const entetes = { Authorization: `Bearer ${cleService}`, apikey: cleService };
  return {
    async enregistrer(cle, contenu, typeMime) {
      const reponse = await fetch(`${base}/${bucket}/${cle}`, {
        method: "POST",
        headers: { ...entetes, "Content-Type": typeMime, "x-upsert": "true" },
        body: new Uint8Array(contenu),
      });
      if (!reponse.ok) throw new Error(`Stockage : échec de l'envoi (${reponse.status})`);
    },
    async lire(cle) {
      const reponse = await fetch(`${base}/${bucket}/${cle}`, { headers: entetes });
      if (!reponse.ok) return null;
      return {
        contenu: Buffer.from(await reponse.arrayBuffer()),
        typeMime: reponse.headers.get("content-type") ?? typeMimeDepuisCle(cle),
      };
    },
    async supprimer(cle) {
      await fetch(`${base}/${bucket}/${cle}`, { method: "DELETE", headers: entetes });
    },
  };
}

/**
 * Vercel Blob, en accès privé : un fichier n'est lisible qu'avec le jeton du
 * serveur, et l'application le sert toujours par ses routes contrôlées.
 */
const stockageBlob: Stockage = {
  async enregistrer(cle, contenu, typeMime) {
    const { put } = await import("@vercel/blob");
    await put(cle, contenu, {
      access: "private",
      contentType: typeMime,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  },
  async lire(cle) {
    const { get } = await import("@vercel/blob");
    const r = await get(cle, { access: "private" }).catch(() => null);
    if (!r || r.statusCode !== 200) return null;
    return {
      contenu: Buffer.from(await new Response(r.stream).arrayBuffer()),
      typeMime: r.blob.contentType || typeMimeDepuisCle(cle),
    };
  },
  async supprimer(cle) {
    const { del } = await import("@vercel/blob");
    await del(cle).catch(() => undefined);
  },
};

export function stockage(): Stockage {
  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && cle) return stockageSupabase(url, cle, process.env.STOCKAGE_BUCKET ?? "medias");
  if (process.env.BLOB_READ_WRITE_TOKEN) return stockageBlob;
  return stockageLocal;
}

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export function typeMimeDepuisCle(cle: string) {
  return TYPES[cle.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}
