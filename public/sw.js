// Service worker de Chilena (PWA · docs/ROADMAP.md Fase 0). Escrito a mano, sin build (guía de PWA de Next 16).
// - Sin señal: si una página no carga, enseña "Se fue la señal en la cancha" (pantalla 08b, /sin-conexion).
// - Los archivos con huella (/_next/static, íconos) se guardan en el celular para abrir más rápido.
// - No guarda páginas ni datos de nadie: todo lo demás va directo a la red.
// - Push: muestra el aviso y al tocarlo abre su liga (href).
const VERSION = "chilena-v1";
const SIN_CONEXION = "/sin-conexion";
const PRECACHE = [SIN_CONEXION, "/brand/icono-192.png", "/brand/icono-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

const esEstatico = (url) =>
  url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/"));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Páginas: siempre de la red; sin señal, la pantalla 08b
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(SIN_CONEXION).then((r) => r ?? Response.error())),
    );
    return;
  }

  // Archivos con huella: del celular primero (no cambian nunca)
  if (esEstatico(url)) {
    event.respondWith(
      caches.match(request).then(
        (guardado) =>
          guardado ??
          fetch(request).then((r) => {
            if (r.ok) {
              const copia = r.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copia));
            }
            return r;
          }),
      ),
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let aviso;
  try {
    aviso = event.data.json();
  } catch {
    aviso = { title: "Chilena", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(aviso.title ?? "Chilena", {
      body: aviso.body ?? "",
      icon: "/brand/icono-192.png",
      badge: "/brand/icono-192.png",
      data: { href: aviso.href ?? "/notificaciones" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href ?? "/notificaciones";
  const destino = new URL(href, self.location.origin);
  // Solo abre páginas de Chilena
  if (destino.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => new URL(v.url).origin === destino.origin);
      if (abierta) return abierta.navigate(destino.href).then((v) => v?.focus());
      return self.clients.openWindow(destino.href);
    }),
  );
});
