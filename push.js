// Notifiche push (Web Push). Resta spenta finché VAPID_PUBLIC è vuoto: nessun effetto sull'app.
// Per attivarla: genera le chiavi VAPID e incolla qui la chiave PUBBLICA (vedi LEGGIMI-notifiche.md).
(function () {
  const VAPID_PUBLIC = "BFNkZveizCHrQ3xicdm4ZLhCFlZpbEQPEU-RCPQklTTgwCeJisnjuQeC7If8fodF6TJRACztBR5nqG0Zflm-Xvg
";

  const supported = () => !!VAPID_PUBLIC && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const b64 = s => {
    const raw = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  };
  let state = 'na'; // 'on' | 'off' | 'denied' | 'na'

  async function refresh() {
    try {
      if (!supported()) state = 'na';
      else if (Notification.permission === 'denied') state = 'denied';
      else {
        const reg = await navigator.serviceWorker.ready;
        state = (await reg.pushManager.getSubscription()) ? 'on' : 'off';
      }
    } catch (e) { state = 'na'; }
    try { render(); } catch (e) {}
  }

  window.pushEnable = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { toast('Notifiche non consentite dal browser.'); return refresh(); }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ||
        await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC) });
      const r = await sb.rpc('save_push', { p_sub: sub.toJSON() });
      if (r.error) throw r.error;
      toast('Notifiche attivate', true);
    } catch (e) { toast('Non sono riuscito ad attivare le notifiche: ' + ((e && e.message) || 'errore')); }
    refresh();
  };

  window.pushDisable = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const s = await reg.pushManager.getSubscription();
      if (s) { await sb.from('push_subs').delete().eq('endpoint', s.endpoint); await s.unsubscribe(); }
      toast('Notifiche disattivate', true);
    } catch (e) { toast('Errore: ' + ((e && e.message) || 'sconosciuto')); }
    refresh();
  };

  function pushCard() {
    if (!supported() || state === 'na') return '';
    const btn = state === 'on' ? '<button onclick="pushDisable()">Disattiva notifiche</button>'
      : state === 'denied' ? '<p class="mu">Le notifiche sono bloccate: riattivale dalle impostazioni del browser per questo sito.</p>'
      : '<button class="p" onclick="pushEnable()">Attiva notifiche</button>';
    return '<div style="margin-top:16px"><b>Notifiche</b></div><p class="mu">Ricevi un avviso quando viene fissata una partita o inserito un risultato.</p>' + btn;
  }

  // si aggancia alla scheda "Aspetto" del Profilo, senza toccare il resto
  const prev = window.aspettoExtra;
  window.aspettoExtra = () => (typeof prev === 'function' ? prev() : '') + pushCard();

  addEventListener('load', () => { if (supported()) setTimeout(refresh, 800); });
})();
