// Tornei e campionati configurabili. Ogni squadra può avere più tornei, salvati nella scheda della squadra (campo "tourns";
// il vecchio campo "tourn" resta leggibile come torneo "Memorial"). Formule: campionato (girone unico, solo andata o andata e ritorno),
// più gironi, fase finale a eliminazione diretta (dopo i gironi o da sola) e la formula del Memorial Stefanelli (Gold/Silver/Bronze/Copper).
// I risultati si inseriscono a mano o si importano; le partite della tua squadra registrate nell'app con lo stesso nome di torneo
// entrano da sole nelle classifiche.
(function () {
  const LET = 'ABCDEFGH';
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
  // Memorial: accoppiamenti fissi degli ottavi [posizione, girone, posizione, girone]
  const OT = [[1, 'A', 4, 'C'], [1, 'B', 4, 'D'], [1, 'C', 4, 'A'], [1, 'D', 4, 'B'], [2, 'A', 3, 'C'], [2, 'B', 3, 'D'], [2, 'C', 3, 'A'], [2, 'D', 3, 'B']];
  const OB = [[5, 'A', 8, 'C'], [5, 'B', 8, 'D'], [5, 'C', 8, 'A'], [5, 'D', 8, 'B'], [6, 'A', 7, 'C'], [6, 'B', 7, 'D'], [6, 'C', 7, 'A'], [6, 'D', 7, 'B']];
  const QP = [[1, 8], [2, 7], [3, 6], [4, 5]];

  const E = s => esc(String(s == null ? '' : s));
  const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nn = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const num = x => { const n = parseInt(x, 10); return isFinite(n) && n >= 0 ? Math.min(n, 99) : null; };
  const team = () => S.teams.find(t => t.id === S.tid);
  const X = () => window.trExt || null;   // vista dei tifosi dalla ricerca per torneo: { o, tid, matches, teams, back }
  const clone = o => JSON.parse(JSON.stringify(o));
  const val = id => { const e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  const st = () => (S.tr = S.tr || { v: 'g', id: null });
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  // il ridisegno avviene dopo che il tocco è finito: altrimenti lo stesso tocco, risalendo, arriva su elementi nuovi (es. la scheda del primo torneo)
  const R = () => setTimeout(() => render(), 0);
  const newId = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ---------- modello ----------
  const fmtOf = o => o.fmt || 'memorial';
  const legsOf = o => (o.legs === 2 ? 2 : 1);
  const GL = o => Object.keys(o.groups || {}).sort();
  const GLn = o => GL(o).filter(g => (o.groups[g] || []).length);
  const hasGroups = o => GLn(o).length > 0;
  const qOf = o => (fmtOf(o) === 'memorial' ? 4 : Math.max(0, +o.q || 0));
  const hasKo = o => fmtOf(o) === 'memorial' || fmtOf(o) === 'ko' || (+o.q > 0 && hasGroups(o));
  const allTeams = o => (fmtOf(o) === 'ko' ? (o.teams || []) : GL(o).flatMap(g => o.groups[g]));
  const isTour = q => q && typeof q === 'object' && q.name;
  function tourList() {
    const t = team(), out = []; if (!t) return out;
    if (isTour(t.tourn)) out.push(Object.assign({ id: 'legacy', fmt: 'memorial' }, clone(t.tourn)));
    Object.keys(t.tourns || {}).forEach(id => { if (isTour(t.tourns[id])) out.push(Object.assign({}, clone(t.tourns[id]), { id })); });
    return out;
  }
  const T = () => {
    const x = X(); if (x) return isTour(x.o) ? x.o : null;
    const id = st().id; return tourList().find(o => o.id === id) || null;
  };
  function fmtText(o) {
    const f = fmtOf(o), ng = GLn(o).length;
    if (f === 'memorial') return '4 gironi + Gold, Silver, Bronze, Copper';
    if (f === 'ko') return 'Eliminazione diretta · ' + (o.teams || []).length + ' squadre';
    return (ng === 1 ? 'Campionato' : ng + ' gironi') + ' · ' + (legsOf(o) === 2 ? 'andata e ritorno' : 'solo andata') + (+o.q > 0 ? ' · poi eliminazione diretta (primi ' + o.q + (ng > 1 ? ' per girone' : '') + ')' : '');
  }

  function save(o) {
    const t = team(); if (!t) return;
    const cl = clone(o), patch = {};
    if (cl.id === 'legacy') { cl.id = newId(); st().id = cl.id; patch.tourn = null; t.tourn = null; }
    t.tourns = Object.assign({}, t.tourns || {}, { [cl.id]: cl }); patch.tourns = t.tourns;
    Promise.resolve(S.db.doc('teams/' + t.id).update(patch)).catch(e => toast('Salvataggio non riuscito: ' + ((e && (e.message || e.code)) || 'errore')));
    R();
  }

  // ---------- calcoli ----------
  const dmy = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? m[3] + '/' + m[2] : ''; };
  const pairKey = (o, r) => legsOf(o) === 2 ? norm(r.h) + '>' + norm(r.a) : [norm(r.h), norm(r.a)].sort().join('|');
  // Partite registrate nell'app che riguardano due squadre dello stesso girone (con lo stesso nome di torneo).
  // Dal dirigente/giocatori: quelle della propria squadra; dai tifosi (ricerca per torneo): quelle di tutte le squadre iscritte.
  function appList(o) {
    const x = X(), out = [], seen = new Set();
    if (!hasGroups(o)) return out;
    const gName = n => { for (const g of GL(o)) { const f = o.groups[g].find(y => nn(y) === nn(n)); if (f) return f; } return null; };
    const gOf = n => GL(o).find(g => o.groups[g].some(y => nn(y) === nn(n)));
    const nameOf = tid => {
      if (tid === (x ? x.tid : S.tid) && o.mine) return o.mine;
      if (!x) return null;
      const t = (x.teams || []).find(q => q.id === tid);
      return t && t.name ? gName(t.name) : null;
    };
    ((x ? x.matches : S.matches) || []).forEach(m => {
      if (!x && (m.tid !== S.tid || norm(m.tourn) !== norm(o.name))) return;
      const h = nameOf(m.tid), a = gName(m.opp);
      if (!h || !a || nn(h) === nn(a) || gOf(h) !== gOf(a)) return;
      const key = [nn(h), nn(a)].sort().join('|') + '|' + (m.date || '');
      if (seen.has(key)) return; seen.add(key);
      out.push({ h, a, gh: +m.gf || 0, ga: +m.ga || 0, played: !!m.played, date: m.date || '', time: m.time || '', g: gOf(h), auto: true });
    });
    return out;
  }
  const autoRes = o => appList(o).filter(r => r.played);
  function gres(o, g) {
    const names = o.groups[g], inG = n => names.some(x => norm(x) === norm(n));
    const key = r => [norm(r.h), norm(r.a)].sort().join('|');
    const man = (o.res || []).filter(r => inG(r.h) && inG(r.a)), cnt = {}, lim = legsOf(o);
    man.forEach(r => { cnt[key(r)] = (cnt[key(r)] || 0) + 1; });
    const extra = [];
    autoRes(o).forEach(r => { if (!inG(r.h) || !inG(r.a)) return; const k = key(r); if ((cnt[k] || 0) < lim) { cnt[k] = (cnt[k] || 0) + 1; extra.push(r); } });
    return man.concat(extra);
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
    return !!((o.force && o.force[g]) || (n > 1 && gres(o, g).length >= n * (n - 1) / 2 * legsOf(o)));
  }
  function slot(o, pos, g) {
    const label = GLn(o).length === 1 ? pos + 'ª classificata' : pos + 'ª Gir. ' + g;
    if (!gdone(o, g)) return { n: null, l: label };
    const r = standings(o, g)[pos - 1];
    return { n: r ? r.n : null, l: label };
  }
  function winner(r) {
    if (!r || r.gh == null || r.ga == null) return null;
    if (r.gh > r.ga) return 'h';
    if (r.gh < r.ga) return 'a';
    if (r.ph != null && r.pa != null && r.ph !== r.pa) return r.ph > r.pa ? 'h' : 'a';
    return null;
  }
  const mkNode = (ko, key, title, H, A) => {
    const r = ko[key] || null, w = winner(r), hn = H.n, an = A.n;
    return { key, title, h: hn, a: an, hl: H.l, al: A.l, r, w: w && hn && an ? (w === 'h' ? hn : an) : null, l: w && hn && an ? (w === 'h' ? an : hn) : null };
  };

  // Memorial: tabellone fisso con le quattro categorie
  function bracketMemorial(o) {
    const N = {}, ko = o.ko || {};
    const mk = (key, title, H, A) => { N[key] = mkNode(ko, key, title, H, A); };
    const ref = (key, side) => { const x = N[key]; return { n: x ? x[side] : null, l: (side === 'w' ? 'Vincente ' : 'Perdente ') + (x ? x.title : '') }; };
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
  // Fase finale generica a eliminazione diretta: teste di serie (prima i primi di ogni girone, poi i secondi…), bye alle teste di serie più alte
  function bracketGeneric(o) {
    const ko = o.ko || {}, ov = o.ov || {}, N = {}, rounds = [];
    let seeds = [];
    if (fmtOf(o) === 'ko') seeds = (o.teams || []).map((n, i) => ({ n, l: (i + 1) + '° testa di serie' }));
    else for (let pos = 1; pos <= qOf(o); pos++) GLn(o).forEach(g => seeds.push(slot(o, pos, g)));
    const S0 = seeds.length; if (S0 < 2) return { N, rounds, seeds: S0 };
    let size = 2; while (size < S0) size *= 2;
    let ord = [1]; while (ord.length < size) { const m = ord.length * 2; ord = ord.flatMap(x => [x, m + 1 - x]); }
    const R = Math.log2(size), rt = r => r === R ? 'Finale' : r === R - 1 ? 'Semifinali' : r === R - 2 ? 'Quarti di finale' : r === R - 3 ? 'Ottavi di finale' : 'Turno ' + r;
    for (let r = 1; r <= R; r++) {
      const keys = [], cnt = size / Math.pow(2, r);
      for (let j = 0; j < cnt; j++) {
        const key = 'K' + r + '-' + j; let H, A, bye = false;
        if (r === 1) {
          const sh = ord[2 * j], sa = ord[2 * j + 1];
          const side = (s, f) => { const o2 = ov[key + ':' + f]; const sd = s <= S0 ? seeds[s - 1] : null; if (o2) return { n: o2, l: o2 }; return sd ? sd : { n: null, l: 'Passa il turno', bye: true }; };
          H = side(sh, 'h'); A = side(sa, 'a');
          bye = !!(H.bye || A.bye);
        } else {
          const p = x => N[x];
          const ph = p('K' + (r - 1) + '-' + (2 * j)), pa = p('K' + (r - 1) + '-' + (2 * j + 1));
          H = { n: ph ? ph.w : null, l: 'Vincente ' + (ph ? ph.title : '') }; A = { n: pa ? pa.w : null, l: 'Vincente ' + (pa ? pa.title : '') };
        }
        const title = r === R ? 'Finale' : rt(r) + ' · partita ' + (j + 1);
        const nd = mkNode(ko, key, title, H, A);
        if (bye) { nd.bye = true; nd.w = H.bye ? A.n : H.n; nd.h = H.bye ? null : H.n; nd.a = A.bye ? null : A.n; nd.hl = H.bye ? 'Passa il turno' : H.l; nd.al = A.bye ? 'Passa il turno' : A.l; nd.r = null; }
        N[key] = nd; keys.push(key);
      }
      rounds.push({ title: rt(r), keys, first: r === 1 });
    }
    return { N, rounds, seeds: S0 };
  }

  // ---------- azioni ----------
  window.trDn = k => { st().dn = k === 'all' ? 'all' : +k; R(); };
  window.trGo = (v, g) => { const s = st(); if (v) s.v = v; if (g) s.g = g; R(); };
  window.trOpen = () => { S.tab = 'trn'; S.tr = { v: 'g', id: null }; R(); };
  window.trBack = () => { S.tab = 'cal'; R(); };
  window.trList = () => { const s = st(); s.id = null; s.v = 'g'; s.imp = ''; R(); };
  window.trPick = id => { const s = st(), o = tourList().find(q => q.id === id); if (!o) return; s.id = id; s.v = hasGroups(o) ? 'g' : 'b'; s.g = null; s.imp = ''; R(); };
  window.trNew = () => { const s = st(); s.v = 'new'; s.id = null; s.sw = s.sw || swDef(); R(); };
  const swDef = () => ({ fm: 'league', name: '', ng: 2, legs: 1, q: 0, tg: {}, list: '' });
  const sw = () => { const s = st(); return s.sw || (s.sw = swDef()); };
  window.trSwFm = fm => { const w = sw(); w.fm = fm; if (fm === 'memorial') { w.ng = 4; w.legs = 1; } R(); };
  window.trSwR = (f, v) => { const w = sw(); w[f] = f === 'ng' ? Math.min(8, Math.max(2, +v || 2)) : (+v || 0); R(); };
  window.trSw = (f, v) => { sw()[f] = v; };
  window.trSwG = (g, v) => { sw().tg[g] = v; };
  window.trPreset = () => { const w = sw(); w.fm = 'memorial'; w.ng = 4; w.legs = 1; w.name = PRESET.name; GL(PRESET).forEach(g => { w.tg[g] = PRESET.groups[g].join('\n'); }); R(); };
  window.trCreate = () => {
    const w = sw(), name = (w.name || '').trim();
    if (!name) return toast('Scrivi il nome del torneo.');
    const o = { id: newId(), v: 2, fmt: w.fm === 'memorial' ? 'memorial' : w.fm === 'ko' ? 'ko' : 'groups', name, mine: '', legs: 1, q: 0, groups: {}, res: [], ko: {}, force: {}, ov: {} };
    if (w.fm === 'ko') {
      o.teams = lines(w.list); if (o.teams.length < 2) return toast('Inserisci almeno 2 squadre, una per riga (la prima è la testa di serie n. 1).');
    } else {
      const ng = w.fm === 'league' ? 1 : w.fm === 'memorial' ? 4 : Math.min(8, Math.max(2, +w.ng || 2));
      for (let i = 0; i < ng; i++) { const g = LET[i], l = lines(w.tg[g]); if (l.length < 2) return toast('Il girone ' + g + ' deve avere almeno 2 squadre (una per riga).'); o.groups[g] = l; }
      if (w.fm !== 'memorial') {
        o.legs = +w.legs === 2 ? 2 : 1;
        const minSize = Math.min(...GL(o).map(g => o.groups[g].length));
        o.q = Math.min(Math.max(0, +w.q || 0), minSize);
        if (o.q > 0 && o.q * ng < 2) return toast('Per la fase finale servono almeno 2 squadre qualificate in tutto.');
      }
    }
    const all = allTeams(o).map(norm);
    if (new Set(all).size !== all.length) return toast('Ci sono due squadre con lo stesso nome.');
    const s = st(); s.id = o.id; s.v = hasGroups(o) ? 'g' : 'b'; s.g = null; s.sw = null;
    save(o);
    toast('Torneo creato', true);
  };
  window.trMine = n => { const o = T(); if (!o) return; const c = clone(o); c.mine = n; save(c); };
  window.trAddRes = () => {
    const o = clone(T()), h = val('tr-h'), a = val('tr-a'), gh = num(val('tr-gh')), ga = num(val('tr-ga'));
    if (!h || !a || h === a) return toast('Scegli due squadre diverse.');
    if (gh == null || ga == null) return toast('Inserisci i gol di entrambe le squadre.');
    const k = pairKey(o, { h, a });
    o.res = (o.res || []).filter(r => pairKey(o, r) !== k);
    const dn = num(val('tr-dn')); const item = { h, a, gh, ga }; if (dn) item.dn = dn;
    o.res.push(item);
    save(o);
  };
  // ---------- importazione da testo incollato (risposta JSON del sito dei risultati) ----------
  function jsonObjs(t) {            // estrae tutti gli oggetti/array JSON presenti nel testo (anche più risposte incollate di seguito)
    const out = []; let d = 0, s0 = -1, inS = false, esc2 = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (inS) { if (esc2) esc2 = false; else if (c === '\\') esc2 = true; else if (c === '"') inS = false; continue; }
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
    const s = st(), cur = T(); if (!cur) return;
    const o = clone(cur);
    const recs = jsonObjs(txt).flatMap(recordsOf);
    if (!recs.length) { s.imp = 'Non ho trovato partite nel testo incollato. Copia la risposta completa (scheda Response) e riprova.'; return R(); }
    let nuove = 0, agg = 0, fasi = 0, nonConf = 0; const diag = []; const sconosciute = new Set(), partiteNo = [];
    o.res = o.res || [];
    recs.forEach(r => {
      const gm = /gir(?:one|\.)?\s*([A-H])\b/i.exec(r.serie_name || '');
      const g = gm ? gm[1].toUpperCase() : (GLn(o).length === 1 && !(/final|ottav|quart|semi|play/i.test(r.serie_name || '')) ? GLn(o)[0] : null);
      if (!g || !o.groups[g]) { fasi++; return; }
      const m = /^\s*(\d+)\s*[-–:]\s*(\d+)\s*$/.exec(String(r.result == null ? '' : r.result));
      if (!m || (r.match_status && r.match_status !== 'validated')) { nonConf++; if (diag.length < 3) diag.push(r.team1_name + ' – ' + r.team2_name + ' (risultato: "' + (r.result == null ? '' : r.result) + '", stato: "' + (r.match_status || '') + '")'); return; }
      const find = n => o.groups[g].find(x => nn(x) === nn(n));
      const h = find(r.team1_name), a = find(r.team2_name);
      if (!h || !a) { if (!h) sconosciute.add(r.team1_name); if (!a) sconosciute.add(r.team2_name); partiteNo.push('G' + (r.day_n || '?') + ' ' + (GLn(o).length > 1 ? 'Gir. ' + g + ': ' : '') + r.team1_name + ' – ' + r.team2_name); return; }
      const item = { h, a, gh: +m[1], ga: +m[2] }, key = pairKey(o, item), i = o.res.findIndex(x => pairKey(o, x) === key);
      if (+r.day_n > 0) item.dn = +r.day_n;
      if (i >= 0) { if (o.res[i].h !== h || o.res[i].gh !== item.gh || o.res[i].ga !== item.ga || o.res[i].dn !== item.dn) agg++; o.res[i] = item; } else { o.res.push(item); nuove++; }
    });
    s.imp = 'Importate ' + nuove + ' partite nuove, ' + agg + ' aggiornate.' + (nonConf ? ' Saltate ' + nonConf + ' senza risultato confermato' + (diag.length ? ' — es. ' + diag.join('; ') : '') + '.' : '') +
      (fasi ? ' Ignorate ' + fasi + ' partite che non sono dei gironi (fasi finali: per ora a mano).' : '') +
      (partiteNo.length ? ' NON importate perché una squadra ha un nome diverso (' + partiteNo.length + '): ' + partiteNo.join('; ') + '. Nomi del sito da correggere in Impostazioni: ' + [...sconosciute].join(', ') + '.' : '');
    save(o);
  };
  window.trSaveSettings = () => {
    const cur = T(); if (!cur) return;
    const o = clone(cur), name = val('tr-sn');
    if (!name) return toast('Scrivi il nome del torneo.');
    const ren = {}; let lost = 0;
    const edit = (old, nl) => { if (nl.length === old.length) old.forEach((x, i) => { if (norm(x) !== norm(nl[i])) ren[norm(x)] = nl[i]; }); return nl; };
    if (fmtOf(o) === 'ko') o.teams = edit(o.teams || [], lines(val('tr-sT')));
    else GL(o).forEach(g => { o.groups[g] = edit(o.groups[g], lines(val('tr-s' + g))); });
    const all = allTeams(o).map(norm);
    if (new Set(all).size !== all.length) return toast('Ci sono due squadre con lo stesso nome.');
    const fix = n => ren[norm(n)] || n, has = n => all.includes(norm(n));
    o.name = name;
    if (fmtOf(o) === 'groups' && document.getElementById('tr-sq')) { const mn = Math.min(...GL(o).map(g => o.groups[g].length)); o.q = Math.min(Math.max(0, num(val('tr-sq')) || 0), mn); }
    const before = (o.res || []).length;
    o.res = (o.res || []).map(r => ({ ...r, h: fix(r.h), a: fix(r.a) })).filter(r => has(r.h) && has(r.a));
    lost = before - o.res.length;
    Object.keys(o.ov || {}).forEach(k => { o.ov[k] = fix(o.ov[k]); if (!has(o.ov[k])) delete o.ov[k]; });
    if (o.mine) o.mine = has(fix(o.mine)) ? fix(o.mine) : '';
    st().imp = ''; save(o);
    toast('Torneo aggiornato' + (lost ? ' (' + lost + ' risultati di squadre tolte eliminati)' : ''), true);
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
  window.trOv = (key, side, v) => { const o = clone(T()); o.ov = o.ov || {}; if (v) o.ov[key + ':' + side] = v; else delete o.ov[key + ':' + side]; save(o); };
  window.trDelete = () => {
    const o = T(), t = team(); if (!o || !t) return;
    if (!confirm('Eliminare il torneo «' + o.name + '» e tutti i risultati inseriti? Le partite della squadra non vengono toccate.')) return;
    const patch = {};
    if (o.id === 'legacy') { t.tourn = null; patch.tourn = null; }
    else { const nt = Object.assign({}, t.tourns || {}); delete nt[o.id]; t.tourns = nt; patch.tourns = nt; }
    Promise.resolve(S.db.doc('teams/' + t.id).update(patch)).catch(e => toast('Non riuscito: ' + ((e && e.message) || 'errore')));
    S.tr = { v: 'g', id: null }; R();
  };

  // ---------- schermate ----------
  const css = document.createElement('style');
  css.textContent = '.trt{width:100%;border-collapse:collapse;font-size:14px}.trt th,.trt td{padding:7px 4px;text-align:center;border-bottom:1px solid var(--bd)}' +
    '.trt .l{text-align:left}.trt .me td{font-weight:800;background:var(--sf)}.trt tr.cut td{border-bottom:2px solid var(--bd)}' +
    '.trk{padding:10px 0;border-bottom:1px solid var(--bd)}.trk .tm{display:flex;justify-content:space-between;gap:8px;padding:2px 0}' +
    '.trk .ph{color:var(--mu);font-style:italic}.trk input[type=number]{width:56px;min-height:40px;text-align:center}.trk .w{font-weight:800}' +
    '.trk .ir{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}.trk details{margin-top:6px}.trk summary{cursor:pointer}';
  document.head.appendChild(css);

  const stRows = (o, g, full) => {
    const rows = standings(o, g), cut = fmtOf(o) === 'memorial' ? 4 : qOf(o);
    return '<table class="trt"><thead><tr><th>#</th><th class="l">Squadra</th><th>G</th><th>V</th><th>N</th><th>P</th>' + (full ? '<th>GF</th><th>GS</th>' : '') + '<th>DR</th><th>Pt</th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr class="' + (norm(r.n) === norm(o.mine) ? 'me' : '') + (cut && i === cut - 1 && i < rows.length - 1 ? ' cut' : '') + '"><td>' + (i + 1) + '</td><td class="l">' + E(r.n) + '</td><td>' + r.g + '</td><td>' + r.v + '</td><td>' + r.p + '</td><td>' + r.s + '</td>' +
        (full ? '<td>' + r.gf + '</td><td>' + r.ga + '</td>' : '') + '<td>' + (r.gf - r.ga > 0 ? '+' : '') + (r.gf - r.ga) + '</td><td><b>' + r.pt + '</b></td></tr>').join('') + '</tbody></table>';
  };

  // classifiche dei miei gironi, per la scheda "Classifiche" (in cima alla vista "Squadra")
  window.trClsPick = id => { st().cls = id; R(); };
  window.torneoClassifica = function () {
    if (X()) return '';
    const items = tourList().map(o => {
      if (!o.mine) return null;
      const g = GL(o).find(x => o.groups && o.groups[x] && o.groups[x].some(y => norm(y) === norm(o.mine))); return g ? { o, g } : null;
    }).filter(Boolean);
    if (!items.length) return '';
    const cur = items.find(i => i.o.id === st().cls) || items[0], o = cur.o, g = cur.g;
    const chips = items.length > 1 ? '<select aria-label="Scegli il torneo" style="width:100%;margin-bottom:8px" onchange="trClsPick(this.value)">' + items.map(i => '<option value="' + E(i.o.id) + '"' + (i === cur ? ' selected' : '') + '>' + E(i.o.name) + '</option>').join('') + '</select>' : '';
    return chips + '<div class="card" style="padding:10px 10px 6px"><b>' + E(o.name) + (GLn(o).length > 1 ? ' · Girone ' + g : '') + '</b><div style="overflow-x:auto">' + stRows(o, g, false) +
      '</div><p style="margin:8px 0 4px"><button class="s" onclick="trOpen();trPick(\'' + E(o.id) + '\')">' + ic('trophy') + ' Apri il torneo</button></p></div>';
  };

  window.torneoBtn = function (t, mgr) {
    const n = tourList().length;
    if (!n && !mgr) return '';
    return '<button class="s plus" onclick="trOpen()" aria-label="Tornei">' + ic('trophy') + ' Torneo</button>';
  };

  function listView(list, mgr) {
    return '<h2 style="margin-top:4px">Tornei e campionati</h2>' + (list.length ? list.map(o => {
      const nres = (o.res || []).length;
      return '<div class="card tcard" style="cursor:pointer;display:flex;align-items:center;gap:12px" onclick="trPick(\'' + E(o.id) + '\')"><div class="crest">' + ic('trophy') + '</div><div class="mid"><b class="hd" style="font-size:20px">' + E(o.name) + '</b><div class="mu" style="white-space:normal">' + E(fmtText(o)) + (nres ? ' · ' + nres + ' risultati' : '') + '</div></div>' + ic('chev') + '</div>';
    }).join('') : '<div class="card mu">Nessun torneo.</div>') +
      (mgr ? '<p><button class="p plus" onclick="trNew()">' + ic('plus') + ' Nuovo torneo</button></p>' : '');
  }

  function setupView(canBack) {
    const w = sw(), fm = w.fm;
    const chip = (k, n) => '<button class="chip' + (fm === k ? ' on' : '') + '" onclick="trSwFm(\'' + k + '\')">' + n + '</button>';
    const ta = (g, ph) => '<label for="tr-g' + g + '">' + ph + '</label><textarea id="tr-g' + g + '" rows="5" style="width:100%" oninput="trSwG(\'' + g + '\',this.value)">' + E(w.tg[g] || '') + '</textarea>';
    const desc = { league: 'Un solo girone con tutte le squadre. Classifica a punti, con la possibilità di una fase finale.', groups: 'Più gironi, con la possibilità di una fase finale a eliminazione diretta dei primi di ogni girone.', ko: 'Solo eliminazione diretta, senza gironi: gli accoppiamenti seguono l’ordine delle teste di serie.', memorial: 'Quattro gironi da otto, poi ottavi, quarti, semifinali Play Off/Play Out e finali nelle categorie Gold, Silver, Bronze e Copper.' }[fm];
    const ng = fm === 'league' ? 1 : fm === 'memorial' ? 4 : Math.min(8, Math.max(2, +w.ng || 2));
    let body = '';
    if (fm === 'ko') body = '<label for="tr-list">Squadre (una per riga, la prima è la testa di serie n. 1)</label><textarea id="tr-list" rows="8" style="width:100%" oninput="trSw(\'list\',this.value)">' + E(w.list || '') + '</textarea>';
    else {
      if (fm === 'memorial') body += '<p><button class="s" onclick="trPreset()">Compila con il Memorial Stefanelli 2026</button></p>';
      if (fm === 'groups') body += '<label for="tr-ng">Numero di gironi</label><select id="tr-ng" onchange="trSwR(\'ng\',this.value)">' + [2, 3, 4, 5, 6, 7, 8].map(n => '<option' + (n === ng ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>';
      if (fm !== 'memorial') {
        body += '<label for="tr-lg">Partite tra le squadre dello stesso girone</label><select id="tr-lg" onchange="trSwR(\'legs\',this.value)"><option value="1"' + (+w.legs !== 2 ? ' selected' : '') + '>Solo andata</option><option value="2"' + (+w.legs === 2 ? ' selected' : '') + '>Andata e ritorno</option></select>' +
          '<label for="tr-q">' + (fm === 'league' ? 'Quante squadre passano alla fase finale (0 = nessuna, è solo un campionato)' : 'Quante squadre per girone passano alla fase finale a eliminazione diretta (0 = nessuna)') + '</label><input id="tr-q" type="number" min="0" max="16" inputmode="numeric" value="' + E(w.q || 0) + '" oninput="trSw(\'q\',this.value)">';
      }
      for (let i = 0; i < ng; i++) body += ta(LET[i], ng === 1 ? 'Squadre (una per riga)' : 'Girone ' + LET[i] + ' (una squadra per riga)');
    }
    return '<div class="card"><h3>Nuovo torneo</h3><div class="csl">' + chip('league', 'Campionato') + chip('groups', 'Più gironi') + chip('ko', 'Eliminazione diretta') + chip('memorial', 'Memorial') + '</div>' +
      '<p class="mu" style="white-space:normal">' + desc + '</p>' +
      '<label for="tr-name">Nome del torneo</label><input id="tr-name" maxlength="80" placeholder="es. Campionato CSI 2026/27" value="' + E(w.name || '') + '" oninput="trSw(\'name\',this.value)">' +
      '<p class="mu" style="white-space:normal">Per far entrare da sole le partite della tua squadra, usa questo stesso nome nel campo «Torneo / campionato» quando crei le partite. Le squadre si possono aggiungere o correggere più avanti, in Impostazioni.</p>' +
      body + '<p style="margin-top:12px"><button class="p" onclick="trCreate()">Crea il torneo</button>' + (canBack ? ' <button class="s" onclick="trList()">Annulla</button>' : '') + '</p></div>';
  }

  function groupsView(o, mgr) {
    const gl = GLn(o), s = st(), g = gl.includes(s.g) ? s.g : (gl[0] || 'A'), done = gdone(o, g), multi = gl.length > 1, two = legsOf(o) === 2;
    const chips = multi ? '<div class="csl">' + gl.map(x => '<button class="chip' + (x === g ? ' on' : '') + '" onclick="trGo(null,\'' + x + '\')">Girone ' + x + '</button>').join('') + '</div>' : '';
    const cut = fmtOf(o) === 'memorial' ? 'Le prime 4 vanno agli ottavi Gold-Silver, dalla 5ª all’8ª agli ottavi Bronze-Copper. ' : (qOf(o) ? 'Le prime ' + qOf(o) + ' passano alla fase finale. ' : '');
    const tbl = '<div class="card" style="padding:6px 10px;overflow-x:auto">' + stRows(o, g, true) + '</div><p class="mu" style="white-space:normal">' + cut + 'A parità di punti: differenza reti, poi gol fatti. ' +
      (hasKo(o) ? (done ? 'Girone concluso.' : 'Il tabellone usa questo girone solo quando tutte le partite sono inserite' + (mgr ? ', oppure se lo segni come concluso.' : '.')) : '') + '</p>';
    const force = mgr && hasKo(o) ? '<p><button class="s" onclick="trForce(\'' + g + '\')">' + ((o.force && o.force[g]) ? 'Riapri il girone' : 'Segna il girone come concluso') + '</button></p>' : '';
    const mine = mgr && !o.mine ? '<div class="card"><b>Qual è la tua squadra?</b><p class="mu" style="white-space:normal">Scegliila: le tue partite registrate nell’app con il nome «' + E(o.name) + '» entreranno da sole nelle classifiche.</p><select onchange="trMine(this.value)"><option value="">Scegli…</option>' +
      gl.map(x => '<optgroup label="' + (multi ? 'Girone ' + x : 'Squadre') + '">' + o.groups[x].map(n => '<option>' + E(n) + '</option>').join('') + '</optgroup>').join('') + '</select></div>' : '';
    const names = o.groups[g], opts = names.map(n => '<option>' + E(n) + '</option>').join('');
    const form = mgr ? '<div class="card"><h3>Inserisci un risultato' + (multi ? ' · Girone ' + g : '') + '</h3><div class="row"><select id="tr-h"><option value="">Casa</option>' + opts + '</select><select id="tr-a"><option value="">Ospite</option>' + opts + '</select></div>' +
      '<div class="row" style="margin-top:8px"><input id="tr-gh" type="number" min="0" max="99" inputmode="numeric" placeholder="Gol casa"><input id="tr-ga" type="number" min="0" max="99" inputmode="numeric" placeholder="Gol ospite"></div>' +
      '<div class="row" style="margin-top:8px"><input id="tr-dn" type="number" min="1" max="99" inputmode="numeric" placeholder="Giornata (facoltativa)"></div><p style="margin:10px 0 0"><button class="p" onclick="trAddRes()">Salva risultato</button></p>' +
      '<p class="mu" style="white-space:normal">' + (two ? 'Andata e ritorno: la stessa coppia con casa e ospite invertiti è un’altra partita; se esiste già lo stesso incontro, viene sostituito.' : 'Se esiste già il risultato di quella coppia, viene sostituito (si gioca solo l’andata).') + '</p></div>' : '';
    const up = appList(o).filter(r => !r.played && r.g === g).sort((p, q) => (p.date + p.time) < (q.date + q.time) ? -1 : 1);
    const upH = up.length ? '<h2>Prossime partite' + (multi ? ' · Girone ' + g : '') + '</h2><div class="card">' + up.map(r => '<div class="trk"><div class="tm"><span>' + E(r.h) + '</span></div><div class="tm"><span>' + E(r.a) + '</span></div><span class="mu">' + E([dmy(r.date), r.time].filter(Boolean).join(' · ') || 'data da definire') + '</span></div>').join('') + '</div>' : '';
    const list = gres(o, g).sort((p, q) => (q.date || '') < (p.date || '') ? -1 : (q.date || '') > (p.date || '') ? 1 : 0), man = o.res || [];
    const per = Math.max(1, Math.floor(names.length / 2));
    const rowH = r => {
      const i = r.auto ? -1 : man.findIndex(x => x.h === r.h && x.a === r.a && x.gh === r.gh && x.ga === r.ga);
      return '<div class="trk"><div class="tm"><span>' + E(r.h) + '</span><b>' + r.gh + '</b></div><div class="tm"><span>' + E(r.a) + '</span><b>' + r.ga + '</b></div>' +
        (r.auto ? '<span class="mu">' + (r.date ? dmy(r.date) + ' · ' : '') + 'dalle partite dell’app</span>' : (mgr && i >= 0 ? '<button class="s" onclick="trDelRes(' + i + ')">Elimina</button>' : '')) + '</div>';
    };
    const byDn = {}; list.forEach(r => { (byDn[r.dn || 0] = byDn[r.dn || 0] || []).push(r); });
    const maxDn = Math.max(0, ...Object.keys(byDn).map(Number));
    const dkeys = []; for (let d = 1; d <= maxDn; d++) dkeys.push(d); if ((byDn[0] || []).length && maxDn) dkeys.push(0);
    const sel = s.dn === 'all' ? 'all' : (dkeys.includes(s.dn) ? s.dn : (maxDn || 'all'));
    const incomplete = d => d > 0 && (byDn[d] || []).length < per;
    const dchips = dkeys.length ? '<div class="csl">' + ['all'].concat(dkeys).map(k => '<button class="chip' + (k === sel ? ' on' : '') + '" onclick="trDn(\'' + k + '\')">' + (k === 'all' ? 'Tutte' : (k === 0 ? 'Senza n.' : 'G' + k + (incomplete(k) ? ' !' : ''))) + '</button>').join('') + '</div>' : '';
    const dayBlock = d => {
      const arr = byDn[d] || [];
      if (d === 0) return '<div style="margin-top:10px"><b>' + (maxDn ? 'Senza numero di giornata' : 'Risultati') + '</b> <span class="mu">' + arr.length + ' partite</span></div>' + arr.map(rowH).join('');
      const miss = arr.length < per, senza = names.filter(n => !arr.some(r => nn(r.h) === nn(n) || nn(r.a) === nn(n)));
      return '<div style="margin-top:10px"><b>Giornata ' + d + '</b> <span class="' + (miss ? '' : 'mu') + '" style="' + (miss ? 'color:var(--dg);font-weight:700' : '') + '">' + arr.length + '/' + per + ' partite</span>' +
        (miss && senza.length && senza.length < names.length ? '<div class="mu" style="white-space:normal">Senza risultato: ' + senza.map(E).join(', ') + '</div>' : '') + '</div>' + arr.map(rowH).join('');
    };
    const shown = !dkeys.length ? [0] : (sel === 'all' ? dkeys : [sel]);
    const lstBody = shown.map(dayBlock).join('');
    const lst = list.length ? '<h2>Risultati inseriti (' + list.length + ')</h2>' + dchips + '<div class="card">' + lstBody + '</div>' : '';
    const imp = mgr ? '<div class="card"><b>Importa dal sito dei risultati</b><p class="mu" style="white-space:normal">Sulla pagina delle giornate apri gli strumenti del browser (F12) → Rete → richiesta «data?widgetId…» → scheda Response, copia tutto e incollalo qui. Puoi incollarne più di seguito (una per giornata). Vengono importate solo le partite dei gironi con risultato confermato.</p><textarea id="tr-imp" rows="4" style="width:100%" placeholder="Incolla qui la risposta…"></textarea>' +
      '<p style="margin:10px 0 0"><button class="p" onclick="trImport()">Importa</button></p>' + (st().imp ? '<p style="white-space:normal;margin:10px 0 0"><b>' + E(st().imp) + '</b></p>' : '') + '</div>' : '';
    return chips + tbl + upH + force + mine + form + imp + lst;
  }

  function nodeHtml(n, mgr, first, allNames) {
    const ready = n.h && n.a && !n.bye, r = n.r;
    const nm = (x, lab, win) => '<span class="' + (x ? (win ? 'w' : '') : 'ph') + '">' + E(x || lab) + '</span>';
    const sc = r ? [r.gh, r.ga] : ['–', '–'];
    let h = '<div class="trk"><div class="mu" style="font-size:12px">' + E(n.title) + '</div>' +
      '<div class="tm">' + nm(n.h, n.hl, n.w && n.w === n.h) + '<b>' + (n.bye ? '' : sc[0]) + (r && r.ph != null ? ' (' + r.ph + ')' : '') + '</b></div>' +
      '<div class="tm">' + nm(n.a, n.al, n.w && n.w === n.a) + '<b>' + (n.bye ? '' : sc[1]) + (r && r.pa != null ? ' (' + r.pa + ')' : '') + '</b></div>';
    if (mgr && ready) {
      const k = n.key, v = (x, f) => x && x[f] != null ? ' value="' + x[f] + '"' : '';
      h += '<div class="ir"><input id="k-' + k + '-gh" type="number" min="0" max="99" inputmode="numeric" placeholder="Gol"' + v(r, 'gh') + ' aria-label="Gol ' + E(n.h) + '"><span>–</span><input id="k-' + k + '-ga" type="number" min="0" max="99" inputmode="numeric" placeholder="Gol"' + v(r, 'ga') + ' aria-label="Gol ' + E(n.a) + '">' +
        '<span class="mu">rigori</span><input id="k-' + k + '-ph" type="number" min="0" max="99" inputmode="numeric" placeholder="–"' + v(r, 'ph') + ' aria-label="Rigori ' + E(n.h) + '"><span>–</span><input id="k-' + k + '-pa" type="number" min="0" max="99" inputmode="numeric" placeholder="–"' + v(r, 'pa') + ' aria-label="Rigori ' + E(n.a) + '">' +
        '<button class="s" onclick="trSaveKo(\'' + k + '\')">Salva</button>' + (r ? '<button class="s" onclick="trClearKo(\'' + k + '\')">Azzera</button>' : '') + '</div>';
    }
    if (mgr && first && allNames) {
      const k = n.key, sel = (side, cur) => '<select onchange="trOv(\'' + k + '\',\'' + side + '\',this.value)" aria-label="Squadra ' + (side === 'h' ? 'casa' : 'ospite') + '"><option value="">' + (side === 'h' ? 'Casa' : 'Ospite') + ': automatica</option>' + allNames.map(x => '<option' + (cur === x ? ' selected' : '') + '>' + E(x) + '</option>').join('') + '</select>';
      h += '<details><summary class="mu">Cambia le squadre di questa partita</summary><div class="ir">' + sel('h', (st().cur || {})[k + ':h']) + sel('a', (st().cur || {})[k + ':a']) + '</div></details>';
    }
    return h + '</div>';
  }

  window.st_c = c => { st().c = c; R(); };
  function bracketView(o, mgr) {
    const pend = GLn(o).filter(g => !gdone(o, g));
    const note = pend.length ? '<p class="mu" style="white-space:normal">Gironi non ancora conclusi: ' + pend.join(', ') + '. Le squadre compaiono qui quando il girone ha tutte le partite inserite.</p>' : '';
    const pen = '<p class="mu" style="white-space:normal">Parità dopo i tempi regolamentari: calci di rigore' + (fmtOf(o) === 'memorial' ? ' (5 a testa)' : '') + '. Inserisci i rigori solo se il risultato è pari.</p>';
    if (fmtOf(o) === 'memorial') {
      const N = bracketMemorial(o), s = st(), c = s.c || 'OT';
      const tabs = [['OT', 'Ottavi'], ...CATS.map(([k, n]) => [k, n])];
      const chips = '<div class="csl">' + tabs.map(([k, n]) => '<button class="chip' + (k === c ? ' on' : '') + '" onclick="st_c(\'' + k + '\')">' + n + '</button>').join('') + '</div>';
      const sec = (t, keys) => '<h2>' + t + '</h2><div class="card">' + keys.map(k => nodeHtml(N[k], mgr)).join('') + '</div>';
      const rg = (p, n) => Array.from({ length: n }, (_, i) => p + (i + 1));
      let body;
      if (c === 'OT') body = sec('Ottavi Gold-Silver', rg('OGS', 8)) + sec('Ottavi Bronze-Copper', rg('OBC', 8));
      else {
        const nm = CATS.find(x => x[0] === c)[1];
        body = sec('Quarti · ' + nm, rg('Q' + c, 4)) + sec('Semifinali Play Off · ' + nm, ['S' + c + 'off1', 'S' + c + 'off2']) + sec('Finale Play Off · ' + nm, ['F' + c + 'off']) +
          sec('Semifinali Play Out · ' + nm, ['S' + c + 'out1', 'S' + c + 'out2']) + sec('Finale Play Out · ' + nm, ['F' + c + 'out']);
      }
      return chips + note + pen + body;
    }
    const B = bracketGeneric(o);
    if (!B.rounds.length) return '<div class="card mu">La fase finale compare quando ci sono almeno 2 squadre qualificate.</div>';
    st().cur = o.ov || {};
    const names = allTeams(o);
    return note + pen + B.rounds.map(rd => '<h2>' + rd.title + '</h2><div class="card">' + rd.keys.map(k => nodeHtml(B.N[k], mgr, rd.first, names)).join('') + '</div>').join('');
  }

  window.torneoView = function (t, mgr) {
    const x = X(), s = st(), list = x ? [] : tourList();
    const toList = !x && (mgr || list.length > 1);
    const back = '<p style="margin:6px 0"><button class="s" onclick="' + (x && x.back || (toList ? 'trList()' : 'trBack()')) + '">' + ic('back') + (x ? ' Indietro' : (toList ? ' Tornei' : ' Partite')) + '</button></p>';
    if (!x) {
      if (s.v === 'new' && mgr) return '<p style="margin:6px 0"><button class="s" onclick="' + (list.length ? 'trList()' : 'trBack()') + '">' + ic('back') + (list.length ? ' Tornei' : ' Partite') + '</button></p>' + setupView(list.length > 0);
      if (!list.find(q => q.id === s.id)) {
        if (!list.length) { if (mgr) { s.v = 'new'; return '<p style="margin:6px 0"><button class="s" onclick="trBack()">' + ic('back') + ' Partite</button></p>' + setupView(false); } return '<p style="margin:6px 0"><button class="s" onclick="trBack()">' + ic('back') + ' Partite</button></p><div class="card mu">Non c’è ancora nessun torneo.</div>'; }
        if (list.length === 1 && !mgr) { s.id = list[0].id; s.v = hasGroups(list[0]) ? 'g' : 'b'; }
        else return '<p style="margin:6px 0"><button class="s" onclick="trBack()">' + ic('back') + ' Partite</button></p>' + listView(list, mgr);
      }
    }
    const o = T();
    if (!o) return back + '<div class="card mu">Torneo non disponibile.</div>';
    let v = s.v === 'x' ? 'x' : s.v === 'b' ? 'b' : 'g';
    if (v === 'g' && !hasGroups(o)) v = 'b';
    if (v === 'b' && !hasKo(o)) v = 'g';
    if (v === 'x' && !mgr) v = hasGroups(o) ? 'g' : 'b';
    const tab = (k, n) => '<button class="chip' + (v === k ? ' on' : '') + '" onclick="trGo(\'' + k + '\')">' + n + '</button>';
    const tabs = '<div class="csl">' + (hasGroups(o) ? tab('g', GLn(o).length > 1 ? 'Gironi' : 'Classifica') : '') + (hasKo(o) ? tab('b', 'Tabellone') : '') + (mgr ? tab('x', 'Impostazioni') : '') + '</div>';
    let body;
    if (v === 'b') body = bracketView(o, mgr);
    else if (v === 'x') {
      const ko = fmtOf(o) === 'ko', gl = GL(o);
      const mineSel = hasGroups(o) ? '<div class="card"><b>La mia squadra nel torneo</b><label>Scegli</label><select onchange="trMine(this.value)"><option value="">Nessuna</option>' +
        gl.map(g => '<optgroup label="' + (gl.length > 1 ? 'Girone ' + g : 'Squadre') + '">' + o.groups[g].map(n => '<option' + (norm(n) === norm(o.mine) ? ' selected' : '') + '>' + E(n) + '</option>').join('') + '</optgroup>').join('') + '</select>' +
        '<p class="mu" style="white-space:normal">Le partite della tua squadra con torneo «' + E(o.name) + '» entrano da sole nelle classifiche.</p></div>' : '';
      body = '<div class="card"><h3>Modifica il torneo</h3><p class="mu" style="white-space:normal">' + E(fmtText(o)) + '</p><label for="tr-sn">Nome del torneo</label><input id="tr-sn" maxlength="80" value="' + E(o.name) + '">' +
        (fmtOf(o) === 'groups' ? '<label for="tr-sq">Squadre per girone che passano alla fase finale (0 = nessuna)</label><input id="tr-sq" type="number" min="0" max="16" inputmode="numeric" value="' + E(o.q || 0) + '">' : '') +
        (ko ? '<label for="tr-sT">Squadre (una per riga, in ordine di testa di serie)</label><textarea id="tr-sT" rows="8" style="width:100%">' + E((o.teams || []).join('\n')) + '</textarea>'
          : gl.map(g => '<label for="tr-s' + g + '">' + (gl.length > 1 ? 'Girone ' + g + ' (una squadra per riga)' : 'Squadre (una per riga)') + '</label><textarea id="tr-s' + g + '" rows="6" style="width:100%">' + E(o.groups[g].join('\n')) + '</textarea>').join('')) +
        '<p class="mu" style="white-space:normal">Per correggere il nome di una squadra cambia la riga senza spostarla: i suoi risultati restano. Per aggiungere una squadra che si iscrive dopo, aggiungi una riga. Se togli righe, i risultati di quelle squadre vengono eliminati. Se cambi il nome del torneo, ricordati di usare lo stesso nome nelle partite della squadra.</p><p><button class="p" onclick="trSaveSettings()">Salva modifiche</button></p></div>' +
        mineSel + '<div class="card"><p style="margin:0"><button class="d" onclick="trDelete()">Elimina il torneo</button></p></div>';
    } else body = groupsView(o, mgr);
    return back + '<h2 style="margin-top:4px">' + E(o.name) + '</h2>' + tabs + body;
  };
})();
