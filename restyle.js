// ===== Restyle: palette unica, schermata "Oggi", rifiniture =====
IC.home='<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>';
(function(){const st=document.createElement('style');st.textContent=`
:root{--bg:#f3f5f9;--sf:#fff;--bd:#e6eaf1;--ac:#0b7a43;--acf:#0b7a43;--ac2:#e3f3ea;--on:#fff}
:root:root:root{--bg:#0a0e15;--sf:#131a27;--bd:#202a3b;--ac:#2fd17a;--acf:#2fd17a;--ac2:#12281d;--on:#04210f}
.card{border-radius:18px;box-shadow:0 1px 2px rgba(15,23,42,.06),0 6px 18px -10px rgba(15,23,42,.18)}
:root:root:root .card{box-shadow:0 1px 0 rgba(255,255,255,.03) inset,0 8px 20px -12px rgba(0,0,0,.6)}
.bar{border-bottom-color:transparent;box-shadow:0 1px 0 var(--bd)}
.bn{border-top-color:transparent;box-shadow:0 -1px 0 var(--bd)}
.bn button.on{color:var(--ac)}.bn .on::before{left:30%;right:30%;height:3px;border-radius:0 0 4px 4px}
.bn button .ic{width:24px;height:24px}
.add .card{box-shadow:none;border:0;padding:0;background:none;margin:12px 0 0}
.add .card h2{font-size:16px}
.ogg-next{display:block;padding:16px;border-radius:22px;background:linear-gradient(160deg,var(--acf),color-mix(in srgb,var(--acf) 68%,#000));color:var(--on);cursor:pointer;box-shadow:0 14px 28px -16px var(--acf)}
.ogg-next .k{font-size:12px;font-weight:800;letter-spacing:.12em;opacity:.8}
.ogg-next .vs{display:flex;align-items:center;gap:12px;margin:10px 0 6px}
.ogg-next .vs b{font:700 28px/1.1 var(--num);letter-spacing:.02em;text-transform:uppercase;overflow-wrap:anywhere}
.ogg-next .w{font-size:14px;font-weight:600;opacity:.92}
.ogg-next .crest{background:rgba(255,255,255,.2)}
.ogg-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.ogg-grid .card{margin:0;padding:14px;text-align:center}
.ogg-grid .k{font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--mu)}
.ogg-grid .v{font:700 34px/1.1 var(--num);margin:6px 0 2px}
.ogg-grid .s{font-size:13px;color:var(--mu);overflow-wrap:anywhere}
.ogg-grid .w .v{color:var(--ac)}.ogg-grid .l .v{color:var(--dg)}
.ogg-rec{display:flex;justify-content:space-around;margin-top:12px;padding:14px}
.ogg-rec div{text-align:center}.ogg-rec b{display:block;font:700 26px var(--num)}.ogg-rec span{font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--mu)}
`;document.head.append(st)})();

function oggiView(t,mgr){
  const ms=S.matches.filter(x=>x.tid===t.id&&inSeason(x)),pl=ms.filter(x=>x.played).sort((a,b)=>a.date<b.date?1:-1),last=pl[0],nx=upNext(t.id);
  const go=id=>`S.tab='cal';S.mid='${id}';render()`;
  const hero=nx?(d=>{const det=matchDetail(nx);return `<div class="ogg-next" onclick="${go(nx.id)}"><div class="k">PROSSIMA PARTITA</div><div class="vs">${crest(nx.oppLogo,ic('shield'),'sm')}<b>vs ${esc(nx.opp)}</b></div><div class="w">${esc(d.f)}${det.time?' · '+esc(det.time):''}</div>${det.location?`<div class="w">${esc(det.location)}</div>`:''}</div>`})(dt(nx.date)):
    `<div class="card" style="text-align:center;padding:22px"><b class="hd">Nessuna partita in programma</b>${mgr?`<p><button class="p" onclick="S.tab='cal';S.nm=true;render()">${ic('plus')} Nuova partita</button></p>`:''}</div>`;
  const cl=last?(last.gf>last.ga?'w':last.gf<last.ga?'l':'d'):'';
  const lastC=last?`<div class="card ${cl}" onclick="${go(last.id)}" style="cursor:pointer"><div class="k">ULTIMO RISULTATO</div><div class="v">${last.gf}–${last.ga}</div><div class="s">vs ${esc(last.opp)}</div></div>`:`<div class="card"><div class="k">ULTIMO RISULTATO</div><div class="v">–</div><div class="s">Nessuna partita giocata</div></div>`;
  const top=S.members.filter(m=>m.tid===t.id&&m.role==='giocatore').map(m=>[m,stats(m).g]).sort((a,b)=>b[1]-a[1])[0];
  const topC=`<div class="card"><div class="k">CAPOCANNONIERE</div><div class="v">${top&&top[1]>0?top[1]:'–'}</div><div class="s">${top&&top[1]>0?esc(top[0].nick):'Ancora nessun gol'}</div></div>`;
  const V=pl.filter(x=>x.gf>x.ga).length,N=pl.filter(x=>x.gf===x.ga).length,P=pl.filter(x=>x.gf<x.ga).length;
  return `${hero}<div class="ogg-grid">${lastC}${topC}</div>
  <div class="card ogg-rec"><div><b>${pl.length}</b><span>GIOCATE</span></div><div><b>${V}</b><span>VINTE</span></div><div><b>${N}</b><span>PAREGGI</span></div><div><b>${P}</b><span>PERSE</span></div></div>`}
