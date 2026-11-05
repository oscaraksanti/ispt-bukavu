/*
 * Service worker de l'ISPT-Bukavu : le site reste consultable quand la
 * connexion est faible ou coupée.
 * - fichiers de l'application, polices et photos : servis depuis le cache ;
 * - pages : réseau d'abord, puis la dernière version consultée, puis une page
 *   « hors ligne » ;
 * - l'administration, les actions et les fichiers privés ne sont jamais mis en cache.
 */
const VERSION = "v7";
const STATIQUE = `ispt-statique-${VERSION}`;
const PAGES = `ispt-pages-${VERSION}`;
const ESPACES = "ispt-espaces";
const HORS_LIGNE = "/hors-ligne";

const JAMAIS = [
  /^\/admin/,
  /^\/api/,
  /^\/pieces/,
  /^\/recu/,
  /^\/documents\//,
  /^\/supports/,
  /^\/valve\/pieces/,
  /^\/stages\/rapport/,
  /^\/devoirs\//,
  /^\/deliberations\//,
  /^\/medias\//,
  /^\/connexion/,
  // Liens à usage unique (jeton dans l'adresse) : ni copie sur l'appareil, ni page rejouée.
  /^\/reinitialiser/,
  /^\/activer/,
  /^\/mot-de-passe-oublie/,
  // « Mon compte » (appareils connectés) n'est jamais conservé sur l'appareil.
  /^\/(etudiant|enseignant)\/compte/,
  /^\/compte\//,
  /^\/messages\//,
  /^\/campus\//,
  /^\/candidat/,
  /^\/confirmer-email/,
  /^\/affiche/,
  /^\/examens\//,
  /\/examens\/agenda$/,
  /^\/anciens\/retrait/,
];
const ESPACE_PERSONNEL = /^\/(etudiant|enseignant)(\/|$)/;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(STATIQUE)
      .then((c) => c.addAll([HORS_LIGNE, "/brand/icon-192.png", "/brand/blason-couleur.svg"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(
          cles
            .filter((c) => c.startsWith("ispt-") && ![STATIQUE, PAGES, ESPACES].includes(c))
            .map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  // À la déconnexion, les pages personnelles conservées sur l'appareil sont effacées.
  if (e.data === "vider-espaces") e.waitUntil(caches.delete(ESPACES));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (JAMAIS.some((r) => r.test(url.pathname))) return;
  // Requêtes internes de Next.js (navigation côté client) : toujours le réseau.
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/photos/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    e.respondWith(
      caches.open(STATIQUE).then(async (c) => {
        const deja = await c.match(req);
        if (deja) return deja;
        const rep = await fetch(req);
        if (rep.ok) c.put(req, rep.clone());
        return rep;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    const cache = ESPACE_PERSONNEL.test(url.pathname) ? ESPACES : PAGES;
    e.respondWith(
      fetch(req)
        .then((rep) => {
          if (rep.ok && !rep.redirected) {
            const copie = rep.clone();
            e.waitUntil(caches.open(cache).then((c) => c.put(req, copie)));
          }
          return rep;
        })
        .catch(async () => (await caches.match(req)) ?? (await caches.match(HORS_LIGNE))),
    );
  }
});

// Notifications sur le téléphone (Web Push) : affichage, puis ouverture de la page concernée.
self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = {};
  }
  e.waitUntil(
    self.registration.showNotification(d.titre || "ISPT-Bukavu", {
      body: d.corps || "",
      icon: "/brand/icon-192.png",
      tag: d.tag,
      renotify: Boolean(d.tag),
      lang: "fr",
      data: { lien: d.lien || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const cible = new URL(
    (e.notification.data && e.notification.data.lien) || "/",
    self.location.origin,
  );
  if (cible.origin !== self.location.origin) return;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      const ouverte = fenetres.find((f) => f.url.startsWith(self.location.origin));
      if (ouverte) return ouverte.focus().then((f) => f.navigate(cible.href));
      return self.clients.openWindow(cible.href);
    }),
  );
});
