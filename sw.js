// LST CLUB: خدمة استقبال إشعارات الهاتف (لا تخزن أي صفحة ولا تغير سلوك الموقع)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

let iconUrl;
async function pickIcon() {
  if (iconUrl !== undefined) return iconUrl;
  for (const n of ['logo.png', 'logo.jpg', 'logo.jpeg']) {
    try {
      const r = await fetch('/' + n, { method: 'HEAD' });
      if (r.ok && /^image\//.test(r.headers.get('content-type') || '')) return (iconUrl = '/' + n);
    } catch (e) {}
  }
  return (iconUrl = null);
}

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) {}
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    cl.forEach(c => c.postMessage({ type: 'notice' }));
    const icon = await pickIcon();
    const o = { body: d.body || '', tag: d.tag || 'lst-club', lang: d.lang || 'ar', dir: d.dir || 'rtl', data: { url: d.url || '/#lists' } };
    if (icon) { o.icon = icon; o.badge = icon; }
    await self.registration.showNotification(d.title || 'LST CLUB', o);
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  let u = new URL((e.notification.data && e.notification.data.url) || '/#lists', self.location.origin);
  if (u.origin !== self.location.origin) u = new URL('/#lists', self.location.origin);
  const url = u.href;
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cl) {
      if (new URL(c.url).origin === self.location.origin) {
        try { await c.focus(); } catch (x) {}
        c.postMessage({ type: 'go', url });
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
