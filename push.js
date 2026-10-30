// Notifiche push (Web Push). Resta spenta finché VAPID_PUBLIC è vuoto: nessun effetto sull'app.
// Per attivarla: genera le chiavi VAPID e incolla qui la chiave PUBBLICA (vedi LEGGIMI-notifiche.md).
(function () {
  const VAPID_PUBLIC = "BFNkZveizCHrQ3xicdm4ZLhCFlZpbEQPEU-RCPQklTTgwCeJisnjuQeC7If8fodF6TJRACztBR5nqG0Zflm-Xvg";

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

  // kind "fan": versione per il profilo tifoso (dentro una propria scheda, testo sulle squadre preferite)
  function pushCard(kind) {
    if (!supported() || state === 'na') return '';
    const fan = kind === 'fan';
    const btn = state === 'on' ? '<button onclick="pushDisable()">Disattiva notifiche</button>'
      : state === 'denied' ? '<p class="mu">Le notifiche sono bloccate: riattivale dalle impostazioni del browser per questo sito.</p>'
      : '<button class="p" onclick="pushEnable()">Attiva notifiche</button>';
    const txt = fan ? 'Ricevi un avviso quando una delle tue squadre preferite fissa una partita o inserisce un risultato.'
                    : 'Ricevi un avviso quando viene fissata una partita o inserito un risultato.';
    return (fan ? '<b>Notifiche</b>' : '<div style="margin-top:16px"><b>Notifiche</b></div>') + '<p class="mu" style="white-space:normal">' + txt + '</p>' + btn;
  }
  window.pushCard = pushCard;
  window.pushState = () => state;

  // si aggancia alla scheda "Aspetto" del Profilo, senza toccare il resto
  const prev = window.aspettoExtra;
  window.aspettoExtra = () => (typeof prev === 'function' ? prev() : '') + pushCard();
  // nota: nella schermata del tifoso la scheda "Notifiche" è aggiunta da tifoso.js (solo con un account)

  // ---- invito ad attivare le notifiche ----
  // Chi apre l'app e non le ha ancora attivate riceve una volta una finestra che lo chiede, senza dover cercare il Profilo.
  // Se la ignora si ripresenta dopo 1 giorno; "Più tardi" la rimanda di 7 giorni; "Non chiedere più" la spegne su questo dispositivo.
  const ASK_KEY = 'pushAsk';
  const askBlocked = () => { try { const v = localStorage.getItem(ASK_KEY); return v === 'never' || Date.now() < (+v || 0); } catch (e) { return false; } };
  const askSet = v => { try { localStorage.setItem(ASK_KEY, String(v)); } catch (e) {} };
  const isMemberNow = () => { try { return !!(S.members && S.members.some(m => m.uid === S.uid)); } catch (e) { return false; } };
  const eligible = () => {
    try {
      if (!S || !S.uid || S.uid === 'tifoso' || !S.profile) return false;   // niente invito a chi non ha un account o non ha finito di registrarsi
      if (isMemberNow()) return true;
      return !!S.fan && !S.browse && typeof fanFavsRaw === 'function' && fanFavsRaw().length > 0;
    } catch (e) { return false; }
  };
  window.pushAskYes = () => { closeSheet(); pushEnable(); };
  window.pushAskLater = () => { askSet(Date.now() + 7 * 864e5); closeSheet(); };
  window.pushAskNever = () => { askSet('never'); closeSheet(); toast('Va bene. Potrai attivarle da Profilo → Aspetto.', true); };

  let askTimer = 0, tries = 0;
  function maybeAsk() {
    if (++tries > 60 || !supported() || askBlocked() || state === 'denied' || state === 'on') return clearInterval(askTimer);
    if (state !== 'off' || !eligible() || document.hidden) return;
    if (document.getElementById('sheet') || document.getElementById('a2hs') || typeof sheet !== 'function') return;   // non sovrapporre altre finestre
    clearInterval(askTimer);
    askSet(Date.now() + 864e5);   // se la chiude toccando fuori, non la rivede prima di domani
    const txt = isMemberNow() ? 'Ti avvisiamo quando la tua squadra fissa una partita o inserisce un risultato.'
                              : 'Ti avvisiamo quando una delle tue squadre preferite fissa una partita o inserisce un risultato.';
    sheet('<h2 style="margin-top:0">Vuoi ricevere gli avvisi?</h2><p class="mu">' + txt + ' Puoi cambiare idea quando vuoi da Profilo → Aspetto.</p>'
      + '<div class="row" style="margin-top:14px"><button class="p" onclick="pushAskYes()">Attiva notifiche</button><button onclick="pushAskLater()">Più tardi</button></div>'
      + '<p style="margin:12px 0 0;text-align:center"><button class="s" onclick="pushAskNever()">Non chiedere più</button></p>');
  }

  addEventListener('load', () => {
    if (!supported()) return;
    setTimeout(refresh, 800);
    askTimer = setInterval(maybeAsk, 3000);
  });
})();
