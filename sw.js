const V = 'lst-v2';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'index.html', 'logo.jpg'])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })
    .catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});

// ===== الإشعارات =====
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'LST CLUB', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some(w => w.visibilityState === 'visible' && w.focused)) return; // المستخدم داخل الموقع الآن
    await self.registration.showNotification(d.title || 'LST CLUB', {
      body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png',
      tag: d.tag || undefined, renotify: !!d.tag, dir: 'rtl', lang: 'ar',
      data: { url: d.url || './' },
    });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope)) {
        await w.focus();
        try { await w.navigate(url); } catch (err) { w.postMessage({ type: 'nav', url }); }
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
