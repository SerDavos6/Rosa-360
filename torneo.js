// Torneo a gironi con fasi finali (Gold / Silver / Bronze / Copper). Tutto è salvato nella scheda della squadra (campo "tourn"),
// quindi non serve nessuno script SQL. I risultati si inseriscono a mano; le partite della tua squadra registrate nell'app con lo
// stesso nome di torneo entrano da sole nella classifica. L'elenco "res" è pensato per ricevere anche risultati importati.
(function () {
  const GN = ['A', 'B', 'C', 'D'];
  const CATS = [['GOLD', 'Gold'], ['SILVER', 'Silver'], ['BRONZE', 'Bronze'], ['COPPER', 'Copper']];
  const PRESET = {
    name: 'Memorial Stefanelli Futsal 2026',
    groups: {
      A: ['Hertha Vernello', 'Jägerkusen', 'F.C. Ludopatykos', 'Kefir F.C.', 'Sleal Madrid', 'Grossiani F.C.', 'Perù Next Generation', 'Real Gipsy'],
      B: ['Sporting Perù', 'Terronia F.C.', 'SPMP', 'Rayo Avellaneda', 'Emozioni C.5', 'Horto Muso', 'T.Team', "O' Bar de Guaglione"],
      C: ['Prosques', 'Bardena', 'Mignottingham', 'La Piana', 'DLT9', 'Perros', 'San Baole', 'M16'],
      D: ['Park F.C.', 'The Wolves', 'Atletico Coiano', 'Manchester Sinty', 'Culones KFC', 'FNC 2.0', 'Mambo F.C.', 'Tabaco y Ron']
    }
  };
  // Accoppiamenti fissi degli ottavi: [posizione, girone, posizione, girone]
  const OT = [[1, 'A', 4, 'C'], [1, 'B', 4, 'D'], [1, 'C', 4, 'A'], [1, 'D', 4, 'B'], [2, 'A', 3, 'C'], [2, 'B', 3, 'D'], [2, 'C', 3, 'A'], [2, 'D', 3, 'B']];
  const OB = [[5, 'A', 8, 'C'], [5, 'B', 8, 'D'], [5, 'C', 8, 'A'], [5, 'D', 8, 'B'], [6, 'A', 7, 'C'], [6, 'B', 7, 'D'], [6, 'C', 7, 'A'], [6, 'D', 7, 'B']];
  const QP = [[1, 8], [2, 7], [3, 6], [4, 5]];

  const E = s => esc(String(s == null ? '' : s));
  const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const num = x => { const n = parseInt(x, 10); return isFinite(n) && n >= 0 ? Math.min(n, 99) : null; };
  const team = () => S.teams.find(t => t.id === S.tid);
  const T = () => { const t = team(); return t && t.tourn && t.tourn.groups ? t.tourn : null; };
  const clone = o => JSON.parse(JSON.stringify(o));
  const val = id => { const e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  const st = () => (S.tr = S.tr || { v: 'g', g: 'A' });

  function save(o) {
    const t = team(); if (!t) return;
    t.tourn = o;
    Promise.resolve(S.db.doc('teams/' + t.id).update({ tourn: o })).catch(e => toast('Salvataggio non riuscito: ' + ((e && (e.message || e.code)) || 'errore')));
    render();
  }

  // ---------- calcoli ----------
  function autoRes(o) {            // partite della mia squadra registrate nell'app con lo stesso nome di torneo
    const out = [];
    if (!o.mine) return out;
    (S.matches || []).forEach(m => {
      if (m.tid !== S.tid || !m.played || norm(m.tourn) !== norm(o.name)) return;
      const opp = GN.reduce((f, g) => f || o.groups[g].find(n => norm(n) === norm(m.opp)), null);
      if (opp && norm(opp) !== norm(o.mine)) out.push({ h: o.mine, a: opp, gh: +m.gf || 0, ga: +m.ga || 0, auto: true });
    });
    return out;
  }
  function gres(o, g) {
    const names = o.groups[g], inG = n => names.some(x => norm(x) === norm(n));
    const key = r => [norm(r.h), norm(r.a)].sort().join('|');
    const man = (o.res || []).filter(r => inG(r.h) && inG(r.a));
    const seen = new Set(man.map(key));
    return man.concat(autoRes(o).filter(r => inG(r.h) && inG(r.a) && !seen.has(key(r)) && seen.add(key(r))));
  }
  function standings(o, g) {
    const rows = o.groups[g].map(n => ({ n, g: 0, v: 0, p: 0, s: 0, gf: 0, ga: 0, pt: 0 }));
    const by = n => rows.find(r => norm(r.n) === norm(n));
    gres(o, g).forEach(r => {
      const a = by(r.h), b = by(r.a); if (!a || !b) return;
      a.g++; b.g++; a.gf += r.gh; a.ga += r.ga; b.gf += r.ga; b.ga += r.gh;
      if (r.gh > r.ga) { a.v++; a.pt += 3; b.s++; } else if (r.gh < r.ga) { b.v++; b.pt += 3; a.s++; } else { a.p++; b.p++; a.pt++; b.pt++; }
    });
    return rows.sort((x, y) => y.pt - x.pt || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.n.localeCompare(y.n));
  }
  function gdone(o, g) {
    const n = o.groups[g].length;
    return (o.force && o.force[g]) || (n > 1 && gres(o, g).length >= n * (n - 1) / 2);
  }
  function slot(o, pos, g) {
    const label = pos + 'ª Gir. ' + g;
    if (!gdone(o, g)) return { n: null, l: label };
    const r = standings(o, g)[pos - 1];
    return { n: r ? r.n : null, l: label };
  }
  function winner(r, h, a) {
    if (!r || r.gh == null || r.ga == null) return null;
    if (r.gh > r.ga) return 'h';
    if (r.gh < r.ga) return 'a';
    if (r.ph != null && r.pa != null && r.ph !== r.pa) return r.ph > r.pa ? 'h' : 'a';
    return null;
  }
  function bracket(o) {
    const N = {}, ko = o.ko || {};
    const mk = (key, title, H, A) => {
      const r = ko[key] || null, w = winner(r), hn = H.n, an = A.n;
      N[key] = { key, title, h: hn, a: an, hl: H.l, al: A.l, r, w: w && hn && an ? (w === 'h' ? hn : an) : null, l: w && hn && an ? (w === 'h' ? an : hn) : null };
    };
    const ref = (key, side) => {
      const x = N[key];
      return { n: x ? x[side] : null, l: (side === 'w' ? 'Vincente ' : 'Perdente ') + (x ? x.title : '') };
    };
    [['OGS', OT, 'Ottavo Gold-Silver'], ['OBC', OB, 'Ottavo Bronze-Copper']].forEach(([p, defs, tt]) =>
      defs.forEach((d, i) => mk(p + (i + 1), (i + 1) + '° ' + tt, slot(o, d[0], d[1]), slot(o, d[2], d[3]))));
    const src = { GOLD: ['OGS', 'w'], SILVER: ['OGS', 'l'], BRONZE: ['OBC', 'w'], COPPER: ['OBC', 'l'] };
    CATS.forEach(([c, nm]) => {
      const [p, side] = src[c];
      QP.forEach(([x, y], j) => mk('Q' + c + (j + 1), 'Quarto ' + (j + 1) + ' ' + nm, ref(p + x, side), ref(p + y, side)));
      [['off', 'w', 'Play Off'], ['out', 'l', 'Play Out']].forEach(([k, sd, lab]) => {
        mk('S' + c + k + '1', 'Semifinale 1 ' + lab + ' ' + nm, ref('Q' + c + '1', sd), ref('Q' + c + '4', sd));
        mk('S' + c + k + '2', 'Semifinale 2 ' + lab + ' ' + nm, ref('Q' + c + '2', sd), ref('Q' + c + '3', sd));
        mk('F' + c + k, 'Finale ' + lab + ' ' + nm, ref('S' + c + k + '1', 'w'), ref('S' + c + k + '2', 'w'));
      });
    });
    return N;
  }

  // ---------- azioni ----------
  window.trGo = (v, g) => { const s = st(); if (v) s.v = v; if (g) s.g = g; render(); };
  window.trOpen = () => { S.tab = 'trn'; st(); render(); };
  window.trBack = () => { S.tab = 'cal'; render(); };
  window.trPreset = () => {
    const set = (id, x) => { const e = document.getElementById(id); if (e) e.value = x; };
    set('tr-name', PRESET.name); GN.forEach(g => set('tr-g' + g, PRESET.groups[g].join('\n')));
  };
  window.trCreate = () => {
    const name = val('tr-name'), groups = {}; let n = 0;
    GN.forEach(g => { groups[g] = val('tr-g' + g).split('\n').map(x => x.trim()).filter(Boolean); n += groups[g].length; });
    if (!name) return toast('Scrivi il nome del torneo.');
    if (n < 2) return toast('Inserisci le squadre dei gironi, una per riga.');
    const all = GN.flatMap(g => groups[g].map(norm));
    if (new Set(all).size !== all.length) return toast('Ci sono due squadre con lo stesso nome.');
    save({ v: 1, name, mine: '', groups, res: [], ko: {}, force: {} });
  };
  window.trMine = n => { const o = clone(T()); o.mine = n; save(o); };
  window.trAddRes = () => {
    const o = clone(T()), g = st().g, h = val('tr-h'), a = val('tr-a'), gh = num(val('tr-gh')), ga = num(val('tr-ga'));
    if (!h || !a || h === a) return toast('Scegli due squadre diverse.');
    if (gh == null || ga == null) return toast('Inserisci i gol di entrambe le squadre.');
    const k = r => [norm(r.h), norm(r.a)].sort().join('|');
    o.res = (o.res || []).filter(r => k(r) !== k({ h, a }));
    o.res.push({ h, a, gh, ga });
    save(o);
  };
  // ---------- importazione da testo incollato (risposta JSON del sito dei risultati) ----------
  const nn = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  function jsonObjs(t) {            // estrae tutti gli oggetti/array JSON presenti nel testo (anche più risposte incollate di seguito)
    const out = []; let d = 0, s0 = -1, inS = false, esc = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (inS) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inS = false; continue; }
      if (c === '"') { if (d > 0) inS = true; continue; }
      if (c === '{' || c === '[') { if (d === 0) s0 = i; d++; }
      else if (c === '}' || c === ']') { d--; if (d <= 0) { if (d === 0 && s0 >= 0) { try { out.push(JSON.parse(t.slice(s0, i + 1))); } catch (e) {} } d = 0; s0 = -1; } }
    }
    return out;
  }
  function recordsOf(x) {
    if (Array.isArray(x)) return x.filter(r => r && r.team1_name);
    if (!x || typeof x !== 'object') return [];
    const r = (x.responseData && x.responseData.dataset && x.responseData.dataset.records) || (x.dataset && x.dataset.records) || x.records;
    return Array.isArray(r) ? r : (x.team1_name ? [x] : []);
  }
  window.trImport = () => {
    const txt = (document.getElementById('tr-imp') || {}).value || '';
    const s = st(), o = clone(T()); if (!o) return;
    const recs = jsonObjs(txt).flatMap(recordsOf);
    if (!recs.length) { s.imp = 'Non ho trovato partite nel testo incollato. Copia la risposta completa (scheda Response) e riprova.'; return render(); }
    const k = r => [norm(r.h), norm(r.a)].sort().join('|');
    let nuove = 0, agg = 0, fasi = 0, nonConf = 0; const sconosciute = new Set();
    o.res = o.res || [];
    recs.forEach(r => {
      const gm = /gir(?:one|\.)?\s*([A-D])\b/i.exec(r.serie_name || '');
      if (!gm) { fasi++; return; }
      const g = gm[1].toUpperCase();
      const m = /^\s*(\d+)\s*[-–]\s*(\d+)\s*$/.exec(r.result || '');
      if (!m || (r.match_status && r.match_status !== 'validated')) { nonConf++; return; }
      const find = n => o.groups[g].find(x => nn(x) === nn(n));
      const h = find(r.team1_name), a = find(r.team2_name);
      if (!h || !a) { if (!h) sconosciute.add(r.team1_name + ' (Gir. ' + g + ')'); if (!a) sconosciute.add(r.team2_name + ' (Gir. ' + g + ')'); return; }
      const item = { h, a, gh: +m[1], ga: +m[2] }, key = k(item), i = o.res.findIndex(x => k(x) === key);
      if (i >= 0) { if (o.res[i].h !== h || o.res[i].gh !== item.gh || o.res[i].ga !== item.ga) agg++; o.res[i] = item; } else { o.res.push(item); nuove++; }
    });
    s.imp = 'Importate ' + nuove + ' partite nuove, ' + agg + ' aggiornate.' + (nonConf ? ' Saltate ' + nonConf + ' senza risultato confermato.' : '') +
      (fasi ? ' Ignorate ' + fasi + ' partite che non sono dei gironi (fasi finali: per ora a mano).' : '') +
      (sconosciute.size ? ' Squadre non riconosciute: ' + [...sconosciute].join(', ') + '.' : '');
    save(o);
  };
  window.trDelRes = i => { const o = clone(T()); o.res.splice(i, 1); save(o); };
  window.trForce = g => { const o = clone(T()); o.force = o.force || {}; o.force[g] = !o.force[g]; save(o); };
  window.trSaveKo = key => {
    const o = clone(T()), gh = num(val('k-' + key + '-gh')), ga = num(val('k-' + key + '-ga'));
    if (gh == null || ga == null) return toast('Inserisci i gol di entrambe le squadre.');
    const r = { gh, ga }, ph = num(val('k-' + key + '-ph')), pa = num(val('k-' + key + '-pa'));
    if (gh === ga) {
      if (ph == null || pa == null || ph === pa) return toast('Pareggio: inserisci i rigori (devono avere un vincitore).');
      r.ph = ph; r.pa = pa;
    }
    o.ko = o.ko || {}; o.ko[key] = r; save(o);
  };
  window.trClearKo = key => { const o = clone(T()); delete (o.ko || {})[key]; save(o); };
  window.trDelete = () => {
    if (!confirm('Eliminare il torneo e tutti i risultati inseriti? Le partite della squadra non vengono toccate.')) return;
    const t = team(); if (!t) return;
    t.tourn = null;
    Promise.resolve(S.db.doc('teams/' + t.id).update({ tourn: null })).catch(e => toast('Non riuscito: ' + ((e && e.message) || 'errore')));
    st().v = 'g'; render();
  };

  // ---------- schermate ----------
  const css = document.createElement('style');
  css.textContent = '.trt{width:100%;border-collapse:collapse;font-size:14px}.trt th,.trt td{padding:7px 4px;text-align:center;border-bottom:1px solid var(--bd)}' +
    '.trt .l{text-align:left}.trt .me td{font-weight:800;background:var(--sf)}.trt tr.cut td{border-bottom:2px solid var(--bd)}' +
    '.trk{padding:10px 0;border-bottom:1px solid var(--bd)}.trk .tm{display:flex;justify-content:space-between;gap:8px;padding:2px 0}' +
    '.trk .ph{color:var(--mu);font-style:italic}.trk input[type=number]{width:56px;min-height:40px;text-align:center}.trk .w{font-weight:800}' +
    '.trk .ir{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}';
  document.head.appendChild(css);

  window.torneoCard = function (t, mgr) {
    const o = T();
    if (o) return '<div class="card"><b>' + E(o.name) + '</b><p class="mu" style="white-space:normal;margin:4px 0 10px">Gironi, classifiche e fasi finali.</p><button class="p" onclick="trOpen()">' + ic('trophy') + ' Apri il torneo</button></div>';
    if (!mgr) return '';
    return '<div class="card"><b>Torneo a gironi</b><p class="mu" style="white-space:normal;margin:4px 0 10px">Crea un torneo con gironi e fasi finali (Gold, Silver, Bronze, Copper) e inserisci i risultati.</p><button onclick="trOpen()">' + ic('plus') + ' Crea un torneo</button></div>';
  };

  function setupView() {
    const ta = g => '<label for="tr-g' + g + '">Girone ' + g + ' (una squadra per riga)</label><textarea id="tr-g' + g + '" rows="5" style="width:100%"></textarea>';
    return '<div class="card"><h3>Nuovo torneo</h3><p class="mu" style="white-space:normal">Quattro gironi, poi ottavi, quarti, semifinali e finali nelle categorie Gold, Silver, Bronze e Copper, come nel Memorial Stefanelli.</p>' +
      '<p><button class="s" onclick="trPreset()">Compila con il Memorial Stefanelli 2026</button></p>' +
      '<label for="tr-name">Nome del torneo</label><input id="tr-name" maxlength="80" placeholder="es. Memorial Stefanelli Futsal 2026">' +
      '<p class="mu" style="white-space:normal">Per far entrare da sole le partite della tua squadra, usa questo stesso nome nel campo «Torneo / campionato» quando crei le partite.</p>' +
      GN.map(ta).join('') + '<p style="margin-top:12px"><button class="p" onclick="trCreate()">Crea il torneo</button></p></div>';
  }

  function groupsView(o, mgr) {
    const s = st(), g = GN.includes(s.g) ? s.g : 'A', rows = standings(o, g), done = gdone(o, g);
    const chips = '<div class="csl">' + GN.map(x => '<button class="chip' + (x === g ? ' on' : '') + '" onclick="trGo(null,\'' + x + '\')">Girone ' + x + '</button>').join('') + '</div>';
    const tbl = '<div class="card" style="padding:6px 10px;overflow-x:auto"><table class="trt"><thead><tr><th>#</th><th class="l">Squadra</th><th>G</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th><th>Pt</th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr class="' + (norm(r.n) === norm(o.mine) ? 'me' : '') + (i === 3 ? ' cut' : '') + '"><td>' + (i + 1) + '</td><td class="l">' + E(r.n) + '</td><td>' + r.g + '</td><td>' + r.v + '</td><td>' + r.p + '</td><td>' + r.s + '</td><td>' + r.gf + '</td><td>' + r.ga + '</td><td>' + (r.gf - r.ga > 0 ? '+' : '') + (r.gf - r.ga) + '</td><td><b>' + r.pt + '</b></td></tr>').join('') +
      '</tbody></table></div><p class="mu" style="white-space:normal">Le prime 4 vanno agli ottavi Gold-Silver, dalla 5ª all’8ª agli ottavi Bronze-Copper. A parità di punti: differenza reti, poi gol fatti (il regolamento non indica altri criteri). ' +
      (done ? 'Girone concluso.' : 'Il tabellone usa questo girone solo quando tutte le partite sono inserite' + (mgr ? ', oppure se lo segni come concluso.' : '.')) + '</p>';
    const force = mgr ? '<p><button class="s" onclick="trForce(\'' + g + '\')">' + ((o.force && o.force[g]) ? 'Riapri il girone' : 'Segna il girone come concluso') + '</button></p>' : '';
    const mine = mgr && !o.mine ? '<div class="card"><b>Qual è la tua squadra?</b><p class="mu" style="white-space:normal">Scegliila: le tue partite registrate nell’app con il nome «' + E(o.name) + '» entreranno da sole nelle classifiche.</p><select onchange="trMine(this.value)"><option value="">Scegli…</option>' +
      GN.map(x => '<optgroup label="Girone ' + x + '">' + o.groups[x].map(n => '<option>' + E(n) + '</option>').join('') + '</optgroup>').join('') + '</select></div>' : '';
    const names = o.groups[g];
    const form = mgr ? '<div class="card"><h3>Inserisci un risultato · Girone ' + g + '</h3><div class="row"><select id="tr-h"><option value="">Casa</option>' + names.map(n => '<option>' + E(n) + '</option>').join('') + '</select><select id="tr-a"><option value="">Ospite</option>' + names.map(n => '<option>' + E(n) + '</option>').join('') + '</select></div>' +
      '<div class="row" style="margin-top:8px"><input id="tr-gh" type="number" min="0" max="99" inputmode="numeric" placeholder="Gol casa"><input id="tr-ga" type="number" min="0" max="99" inputmode="numeric" placeholder="Gol ospite"></div><p style="margin:10px 0 0"><button class="p" onclick="trAddRes()">Salva risultato</button></p><p class="mu" style="white-space:normal">Se esiste già il risultato di quella coppia, viene sostituito (si gioca solo l’andata).</p></div>' : '';
    const list = gres(o, g), man = o.res || [];
    const lst = list.length ? '<h2>Risultati inseriti (' + list.length + ')</h2><div class="card">' + list.map(r => {
      const i = r.auto ? -1 : man.findIndex(x => x.h === r.h && x.a === r.a && x.gh === r.gh && x.ga === r.ga);
      return '<div class="trk"><div class="tm"><span>' + E(r.h) + '</span><b>' + r.gh + '</b></div><div class="tm"><span>' + E(r.a) + '</span><b>' + r.ga + '</b></div>' +
        (r.auto ? '<span class="mu">dalle partite dell’app</span>' : (mgr && i >= 0 ? '<button class="s" onclick="trDelRes(' + i + ')">Elimina</button>' : '')) + '</div>';
    }).join('') + '</div>' : '';
    const imp = mgr ? '<div class="card"><b>Importa dal sito dei risultati</b><p class="mu" style="white-space:normal">Sulla pagina delle giornate apri gli strumenti del browser (F12) → Rete → richiesta «data?widgetId…» → scheda Response, copia tutto e incollalo qui. Puoi incollarne più di seguito (una per giornata). Vengono importate solo le partite dei gironi con risultato confermato.</p><textarea id="tr-imp" rows="4" style="width:100%" placeholder="Incolla qui la risposta…"></textarea>' +
      '<p style="margin:10px 0 0"><button class="p" onclick="trImport()">Importa</button></p>' + (st().imp ? '<p style="white-space:normal;margin:10px 0 0"><b>' + E(st().imp) + '</b></p>' : '') + '</div>' : '';
    return chips + tbl + force + mine + form + imp + lst;
  }

  function nodeHtml(n, mgr) {
    const ready = n.h && n.a, r = n.r;
    const nm = (x, lab, win) => '<span class="' + (x ? (win ? 'w' : '') : 'ph') + '">' + E(x || lab) + '</span>';
    const sc = r ? [r.gh, r.ga] : ['–', '–'];
    let h = '<div class="trk"><div class="mu" style="font-size:12px">' + E(n.title) + '</div>' +
      '<div class="tm">' + nm(n.h, n.hl, n.w && n.w === n.h) + '<b>' + sc[0] + (r && r.ph != null ? ' (' + r.ph + ')' : '') + '</b></div>' +
      '<div class="tm">' + nm(n.a, n.al, n.w && n.w === n.a) + '<b>' + sc[1] + (r && r.pa != null ? ' (' + r.pa + ')' : '') + '</b></div>';
    if (mgr && ready) {
      const k = n.key, v = (x, f) => x && x[f] != null ? ' value="' + x[f] + '"' : '';
      h += '<div class="ir"><input id="k-' + k + '-gh" type="number" min="0" max="99" inputmode="numeric" placeholder="Gol"' + v(r, 'gh') + ' aria-label="Gol ' + E(n.h) + '"><span>–</span><input id="k-' + k + '-ga" type="number" min="0" max="99" inputmode="numeric" placeholder="Gol"' + v(r, 'ga') + ' aria-label="Gol ' + E(n.a) + '">' +
        '<span class="mu">rigori</span><input id="k-' + k + '-ph" type="number" min="0" max="99" inputmode="numeric" placeholder="–"' + v(r, 'ph') + ' aria-label="Rigori ' + E(n.h) + '"><span>–</span><input id="k-' + k + '-pa" type="number" min="0" max="99" inputmode="numeric" placeholder="–"' + v(r, 'pa') + ' aria-label="Rigori ' + E(n.a) + '">' +
        '<button class="s" onclick="trSaveKo(\'' + k + '\')">Salva</button>' + (r ? '<button class="s" onclick="trClearKo(\'' + k + '\')">Azzera</button>' : '') + '</div>';
    }
    return h + '</div>';
  }

  function bracketView(o, mgr) {
    const N = bracket(o), s = st(), c = s.c || 'OT';
    const tabs = [['OT', 'Ottavi'], ...CATS.map(([k, n]) => [k, n])];
    const chips = '<div class="csl">' + tabs.map(([k, n]) => '<button class="chip' + (k === c ? ' on' : '') + '" onclick="st_c(\'' + k + '\')">' + n + '</button>').join('') + '</div>';
    const pend = GN.filter(g => !gdone(o, g));
    const note = pend.length ? '<p class="mu" style="white-space:normal">Gironi non ancora conclusi: ' + pend.join(', ') + '. Le squadre compaiono qui quando il girone ha tutte le partite inserite.</p>' : '';
    const sec = (t, keys) => '<h2>' + t + '</h2><div class="card">' + keys.map(k => nodeHtml(N[k], mgr)).join('') + '</div>';
    const rg = (p, n) => Array.from({ length: n }, (_, i) => p + (i + 1));
    let body;
    if (c === 'OT') body = sec('Ottavi Gold-Silver', rg('OGS', 8)) + sec('Ottavi Bronze-Copper', rg('OBC', 8));
    else {
      const nm = CATS.find(x => x[0] === c)[1];
      body = sec('Quarti · ' + nm, rg('Q' + c, 4)) + sec('Semifinali Play Off · ' + nm, ['S' + c + 'off1', 'S' + c + 'off2']) + sec('Finale Play Off · ' + nm, ['F' + c + 'off']) +
        sec('Semifinali Play Out · ' + nm, ['S' + c + 'out1', 'S' + c + 'out2']) + sec('Finale Play Out · ' + nm, ['F' + c + 'out']);
    }
    return chips + note + '<p class="mu" style="white-space:normal">Parità dopo i tempi regolamentari: calci di rigore (5 a testa). Inserisci i rigori solo se il risultato è pari.</p>' + body;
  }
  window.st_c = c => { st().c = c; render(); };

  window.torneoView = function (t, mgr) {
    const o = T(), back = '<p style="margin:6px 0"><button class="s" onclick="trBack()">' + ic('back') + ' Partite</button></p>';
    if (!o) return back + (mgr ? setupView() : '<div class="card mu">Il dirigente non ha ancora creato un torneo.</div>');
    const s = st(), v = s.v === 'b' ? 'b' : s.v === 'x' ? 'x' : 'g';
    const tabs = '<div class="csl"><button class="chip' + (v === 'g' ? ' on' : '') + '" onclick="trGo(\'g\')">Gironi</button><button class="chip' + (v === 'b' ? ' on' : '') + '" onclick="trGo(\'b\')">Tabellone</button>' + (mgr ? '<button class="chip' + (v === 'x' ? ' on' : '') + '" onclick="trGo(\'x\')">Impostazioni</button>' : '') + '</div>';
    let body;
    if (v === 'b') body = bracketView(o, mgr);
    else if (v === 'x' && mgr) body = '<div class="card"><b>' + E(o.name) + '</b><label>La mia squadra nel torneo</label><select onchange="trMine(this.value)"><option value="">Nessuna</option>' +
      GN.map(x => '<optgroup label="Girone ' + x + '">' + o.groups[x].map(n => '<option' + (norm(n) === norm(o.mine) ? ' selected' : '') + '>' + E(n) + '</option>').join('') + '</optgroup>').join('') + '</select>' +
      '<p class="mu" style="white-space:normal">Le partite della tua squadra con torneo «' + E(o.name) + '» entrano da sole nelle classifiche dei gironi.</p>' +
      '<p style="margin-top:16px"><button class="d" onclick="trDelete()">Elimina il torneo</button></p></div>';
    else body = groupsView(o, mgr);
    return back + '<h2 style="margin-top:4px">' + E(o.name) + '</h2>' + tabs + body;
  };
})();
