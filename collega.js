// Collegamento tra due partite di squadre iscritte. Le dirette restano SEPARATE: ogni dirigente registra la propria partita;
// qui si aggiungono solo (1) la scelta di un avversario iscritto e (2) il punteggio dell'altra squadra in sola lettura,
// con un avviso se i due risultati non coincidono. Serve la funzione SQL "paired_match" (vedi collega-partite.sql).
(function () {
  // ---------- scelta dell'avversario tra le squadre iscritte ----------
  let sugT = 0, sugSeq = 0;
  const nameOf = t => String(t && t.name || '').trim();

  function sugHtml() {
    if (S.nmOpp) {
      return '<div class="mu" style="margin:6px 2px;white-space:normal">' + ic('shield') + ' Collegata alla squadra iscritta <b>' + esc(S.nmOpp.name) +
        '</b>: nella partita vedrai anche il punteggio che segna il suo dirigente.</div>';
    }
    if (S.nmSug && S.nmSug.length) {
      return '<div class="card" style="padding:4px 8px;margin:6px 0"><div class="mu" style="margin:6px 2px">Squadre iscritte: tocca per collegarla</div>' +
        S.nmSug.map((t, i) => '<div class="frs" data-i="' + i + '" onclick="oppPick(+this.dataset.i)">' + crest(t.logo, ic('shield'), 'sm') +
          '<div class="mid"><b>' + esc(nameOf(t)) + '</b></div></div>').join('') + '</div>';
    }
    return '';
  }
  const paintSug = () => { const e = document.getElementById('opp-sug'); if (e) e.innerHTML = sugHtml(); };
  window.oppSugHtml = sugHtml;

  window.oppType = function (val) {
    val = String(val || '').trim();
    if (S.nmOpp && S.nmOpp.name !== val) { S.nmOpp = null; paintSug(); }   // ha cambiato il testo: il collegamento cade subito
    clearTimeout(sugT);
    if (S.nmOpp || val.length < 2) { S.nmSug = null; paintSug(); return; }
    const mine = ++sugSeq;
    sugT = setTimeout(async () => {
      try {
        const r = await sb.rpc('fan_search', { q: val });
        if (mine !== sugSeq) return;
        S.nmSug = r.error ? null : ((r.data && r.data.teams) || []).filter(t => t.id && t.id !== S.tid).slice(0, 5);
      } catch (e) { S.nmSug = null; }
      paintSug();
    }, 300);
  };

  window.oppPick = function (i) {
    const t = S.nmSug && S.nmSug[i]; if (!t) return;
    S.nmOpp = { id: t.id, name: nameOf(t), logo: t.logo || '' };
    S.nmSug = null;
    const inp = document.getElementById('mo'); if (inp) inp.value = S.nmOpp.name;
    try { h2hLive(S.nmOpp.name); } catch (e) {}
    paintSug();
  };

  // ---------- punteggio dell'altra squadra ----------
  const PAIR = {};   // id partita -> { d: dati | null | undefined, t: ultimo controllo, busy }

  function pairLoad(mid, force) {
    const c = PAIR[mid] || (PAIR[mid] = { d: undefined, t: 0, busy: false });
    if (c.busy || (!force && Date.now() - c.t < 15000)) return;
    c.busy = true;
    sb.rpc('paired_match', { mid }).then(r => {
      if (r.error) return;                                      // funzione assente o errore: la scheda resta nascosta
      const nd = r.data || null, changed = JSON.stringify(nd) !== JSON.stringify(c.d);
      c.d = nd;
      if (changed && S.mid === mid && !(typeof lvBusy === 'function' && lvBusy())) { try { render(); } catch (e) {} }
    }).catch(() => {}).finally(() => { c.busy = false; c.t = Date.now(); });
  }

  window.pairedBox = function (x) {
    if (!x || S.fan || !x.id) return '';
    pairLoad(x.id);
    const c = PAIR[x.id];
    if (!c || c.d === undefined) return '';
    const o = c.d;
    if (!o) {
      return x.oppTid
        ? '<div class="card mu" style="white-space:normal">' + ic('shield') + ' Partita collegata a una squadra iscritta. Quando il suo dirigente inserisce la stessa partita (stessa data), qui vedrai il suo punteggio.</div>'
        : '';
    }
    // il loro "gf" sono i gol loro, il loro "ga" sono i nostri: qui sempre nell'ordine noi–loro
    const us = +o.ga || 0, them = +o.gf || 0, mine = +x.gf || 0, mineAg = +x.ga || 0;
    const diff = us !== mine || them !== mineAg, both = !!x.played && !!o.played;
    const st = o.live ? '<span class="lvb">IN DIRETTA</span>' : (o.played ? 'Finale' : 'Da giocare');
    let note = '';
    if (both && diff) note = '<p style="margin:10px 0 0;color:var(--dg);font-weight:700;white-space:normal">Il risultato non coincide: voi avete ' + mine + '–' + mineAg + ', loro ' + us + '–' + them + '. Controllate con il dirigente di ' + esc(o.name || 'questa squadra') + '.</p>';
    else if (diff && (o.live || o.played)) note = '<p class="mu" style="margin:10px 0 0;white-space:normal">I due punteggi per ora non coincidono (voi ' + mine + '–' + mineAg + ').</p>';
    else if (o.live || o.played) note = '<p class="mu" style="margin:10px 0 0">I due punteggi coincidono.</p>';
    return '<div class="card"><b>Dall’altra squadra · ' + esc(o.name || 'avversario') + '</b> ' + st +
      '<div class="hd" style="font-size:26px;margin-top:6px">' + us + '–' + them + '</div>' +
      '<div class="mu" style="white-space:normal">È il punteggio registrato nella loro partita (noi–loro). Le due dirette restano separate.</div>' + note + '</div>';
  };

  // anche nella scheda "In diretta" dei dirigenti
  const lc = window.liveCardHtml;
  if (typeof lc === 'function') window.liveCardHtml = x => pairedBox(x) + lc(x);

  // mentre la partita è aperta e in corso, controlla l'altra squadra ogni 15 secondi
  setInterval(() => {
    try {
      if (document.hidden || !S || S.fan || !S.mid) return;
      const x = S.matches.find(m => m.id === S.mid); if (!x) return;
      const d = new Date(), today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (x.played && x.date !== today) return;
      pairLoad(x.id, true);
    } catch (e) {}
  }, 15000);
})();
