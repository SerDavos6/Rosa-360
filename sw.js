// Service worker v9: le pagine vanno "rete prima" (attesa massima 4 secondi, poi la copia salvata);
// i file fissi (script, icone, font, libreria) escono subito dalla copia salvata e si aggiornano dietro le quinte.
// Non tocca Supabase né le richieste non-GET, così i dati restano sempre aggiornati.
const V = 'squadra-v45';
const SUPA = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
const SHELL = ['./', 'index.html', 'ui-extra.js?v=11', 'match-report.js?v=17', 'fluido.js?v=10', 'restyle.js?v=10', 'rinnova.js?v=13', 'tifoso.js?v=10', 'push.js?v=5', 'collega.js?v=2', 'torneo.js?v=3','manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png'];
const EXT = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const good = res => res && (res.ok || res.type === 'opaque');
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all([
    ...SHELL.map(u => c.add(u).catch(() => {})),
    // modalità cors (non più no-cors): serve perché la copia salvata resti valida anche con il controllo di integrità (SRI) sul tag script
    fetch(new Request(SUPA, { mode: 'cors' })).then(r => { if (r.ok) return c.put(SUPA, r); }).catch(() => {})
  ])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
// ---- notifiche push ----
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || 'Rosa 360', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || undefined, data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { if (c.navigate) c.navigate(url).catch(() => {}); return c.focus(); } }
    return clients.openWindow(url);
  }));
});
const swr = (r, c) => c.match(r).then(m => {
  const net = fetch(r).then(res => { if (good(res)) c.put(r, res.clone()); return res; }).catch(() => null);
  return m || net.then(res => res || Response.error());
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin && r.mode === 'navigate') {
    e.respondWith(caches.open(V).then(c => {
      const net = fetch(r, { cache: 'no-cache' }).then(res => { if (res.ok) c.put(r, res.clone()); return res; });
      const stop = new Promise((_, no) => setTimeout(no, 4000));
      return Promise.race([net, stop]).catch(() => c.match(r).then(m => m || c.match('index.html')).then(m => m || net));
    }));
    return;
  }
  if (u.origin === location.origin || EXT.includes(u.hostname)) e.respondWith(caches.open(V).then(c => swr(r, c)));
});
