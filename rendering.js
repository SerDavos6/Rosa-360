// ===== Schermate come nel rendering «Matchday» =====
// Ridisegna Home, Rosa, Classifiche, Io e i comandi della diretta.
// Usa le stesse funzioni e gli stessi dati di prima: cambia solo come sono disposti.
(function(){
const W0=window;
const iniOf=n=>esc(String(n||'?').replace(/[^A-Za-z0-9À-ÿ ]/g,'').split(/\s+/).filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?');
W0.teamIni=iniOf;   // iniziali di una squadra senza logo (scheda partita)
const avOf=(m,c)=>m&&m.photo?`<span class="${c}"><img loading="lazy" decoding="async" src="${safeSrc(m.photo)}" alt=""></span>`:`<span class="${c}">${iniOf(m&&m.nick)}</span>`;
const res=x=>x.gf>x.ga?'v':x.gf<x.ga?'p':((typeof pensRes==='function'&&pensRes(x))||'n');
const seasonTxt=()=>{try{const s=activeSeason();return s==='all'?'Tutte le stagioni':'Stagione '+s}catch(e){return ''}};

// ---------- HOME ----------
W0.homeTab=function(t,mgr){
  const all=S.matches.filter(x=>x.tid===t.id),ms=all.filter(inSeason);
  // il modulo "Nuova partita" resta quello di sempre
  let form='';if(mgr&&S.nm){try{form=calView(t,mgr,false).split('\n  <div class="tool">')[0]}catch(e){}}
  const n=new Date(),p=v=>String(v).padStart(2,'0'),ds=n.getFullYear()+'-'+p(n.getMonth()+1)+'-'+p(n.getDate());
  const up=all.filter(x=>!x.played&&x.date>=ds).sort((a,b)=>a.date<b.date?-1:1).slice(1);
  const pl=ms.filter(x=>x.played).sort((a,b)=>a.date<b.date?1:-1);
  const row=x=>{const d=dt(x.date),k=x.played?res(x):'';
    return `<button class="hm-row" onclick="S.mid='${x.id}';render()"><span class="hm-d"><b>${d.d}</b>${d.m}</span>${crest(x.oppLogo,iniOf(x.opp),'hm-lg')}<span class="hm-t"><b>${esc(x.opp)}</b><span>${esc([x.tourn||'Amichevole',matchPhase(x)].filter(Boolean).join(' · '))}</span></span>${x.played?`<span class="hm-s ${k}">${esc(x.gf)}–${esc(x.ga)}${(p=>p?`<small>rig. ${p.h}–${p.a}</small>`:'')(typeof pensOf==='function'&&pensOf(x))}</span>`:`<span class="hm-u">${esc(matchDetail(x).time||'Da giocare')}</span>`}</button>`};
  const fm=pl.slice(0,5).reverse().map(x=>`<i class="rb ${res(x)}">${res(x).toUpperCase()}</i>`).join('');
  const shown=S.allM?pl:pl.slice(0,5);
  return `${form}${nextMatch(all)}${typeof torneoHome==='function'?torneoHome():''}
  ${mgr&&!S.nm?`<button class="hm-new" onclick="openNm()">${ic('plus')} Nuova partita</button>`:''}
  ${up.length?`<h2 class="hm-h">Prossime</h2><div class="card hm-list">${up.map(row).join('')}</div>`:''}
  <div class="hm-head"><h2>Ultime partite</h2>${fm?`<span class="fmq">${fm}</span>`:''}</div>
  ${pl.length?`<div class="card hm-list">${shown.map(row).join('')}</div>${pl.length>5?`<button class="hm-more" onclick="S.allM=!S.allM;render()">${S.allM?'Mostra solo le ultime 5':'Vedi altre partite'}</button>`:''}`
    :emptyState('ball','Nessuna partita giocata',mgr?'Crea la prima partita per registrare gol, presenze e formazione.':'Qui vedrai i risultati della squadra.',mgr&&!S.nm?`<button class="p" onclick="openNm()">${ic('plus')} Nuova partita</button>`:'')}`};

// ---------- ROSA ----------
W0.rosaBody=function(ms,ctl){
  const t=S.teams.find(x=>x.id===S.tid)||{},gs=rosaGroups(ms),f=gs.some(g=>g[0]===S.rf)?S.rf:'';
  const nPl=ms.filter(m=>m.role==='giocatore').length;
  const SH={P:'Portieri',D:'Difensori',C:'Centrocampisti',A:'Attaccanti','?':'Senza ruolo',dir:'Dirigenti'};
  const chips=`<div class="rs-chips"><button class="${f?'':'on'}" onclick="setRf('')">Tutti</button>${gs.map(([k])=>`<button class="${f===k?'on':''}" onclick="setRf('${k}')">${SH[k]||k}</button>`).join('')}</div>`;
  const o=m=>m.role==='giocatore'?ovr(m):-1,srt=l=>l.slice().sort((a,b)=>o(b)-o(a)||(a.nick||'').localeCompare(b.nick||''));
  const card=m=>{let h=fut(m,ctl(m));return `<div data-q="${esc(rosaQ(m))}">${h}</div>`};
  const sel=f?gs.filter(g=>g[0]===f):gs,list=sel.flatMap(g=>g[2]);
  const cards=sel.map(([k,n,l])=>`${f?'':`<h2 class="rs-h">${esc(n)} · ${l.length}</h2>`}<div class="grid rs-grid">${srt(l).map(card).join('')}</div>`).join('');
  return `<div class="pg-hd"><div><span class="pg-k">${esc(t.name||'')}${seasonTxt()?' · '+esc(seasonTxt().replace('Stagione ','')):''}</span><h1>La rosa</h1></div><span class="pg-n"><b>${nPl}</b> giocatori</span></div>
  ${chips}${list.length?cards:emptyState('users','Rosa vuota','Condividi il codice invito dal Profilo oppure aggiungi i membri a mano.','')}`};

// ---------- CLASSIFICHE ----------
W0.clsView=function(t,embed){
  const pls=S.members.filter(m=>m.tid===t.id&&m.role==='giocatore');
  const played=S.matches.filter(x=>x.tid===t.id&&x.played&&inSeason(x));
    const tabs=[['sq','Squadra'],['ov','Overall'],['g','Gol'],['a','Assist'],['p','Presenze']];
  const cs=tabs.some(x=>x[0]===S.cs)?S.cs:'sq';
  const val=m=>{const s=stats(m);return cs==='ov'?ovr(m):cs==='g'?s.g:cs==='a'?s.a:s.p};
  const seg=`<div class="cl-seg" role="tablist">${tabs.map(([k,n])=>`<button role="tab" aria-selected="${cs===k}" class="${cs===k?'on':''}" onclick="S.cs='${k}';render()">${n}</button>`).join('')}</div>`;
  const hd=embed?'':`<div class="pg-hd"><div><span class="pg-k">${esc(seasonTxt())} · ${played.length} partit${played.length===1?'a':'e'}</span><h1>Classifiche</h1></div></div>`;
  let body;
  if(cs==='sq')body=(typeof torneoClassifica==='function'?torneoClassifica():'')+squadBlock(t);
  else{const l=pls.map(m=>({m,v:val(m)})).filter(a=>cs==='ov'||a.v>0).sort((a,b)=>b.v-a.v||(a.m.nick||'').localeCompare(b.m.nick||''));
    if(!l.length)body=emptyState('trophy','Ancora nessun dato','La classifica si riempie con le partite giocate.','');
    else{const pod=cs==='ov',top=pod?l.slice(0,3):[],rest=pod?l.slice(3):l,off=pod?4:1,mx=l[0].v||1;
      const st=i=>`<div class="cl-p cl-p${i+1}">${avOf(top[i].m,'cl-av')}<b class="cl-pn">${esc(top[i].m.nick)}</b><div class="cl-st"><b>${top[i].v}</b><span>${i+1}°</span></div></div>`;
      body=`${pod?`<div class="cl-pod">${[1,0,2].filter(i=>top[i]).map(st).join('')}</div>`:''}
      ${rest.length?`<div class="card cl-list${pod?'':' solo'}">${rest.map((a,i)=>`<button class="cl-r" onclick="S.pd='${a.m.id}';render()"><span class="cl-k">${i+off}</span>${avOf(a.m,'cl-av sm')}<span class="cl-n"><b>${esc(a.m.nick)}</b><i><i style="width:${Math.max(4,Math.round(a.v/mx*100))}%"></i></i></span><b class="cl-v">${a.v}</b></button>`).join('')}</div>`:''}`}}
  return `${hd}${seg}${body}<p style="margin-top:14px"><button class="p" onclick="shareClass()">${ic('share')} Condividi classifica</button></p>`};

// ---------- stile ----------
const st=document.createElement('style');st.id='rendering';st.textContent=`
.pg-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:4px 2px 12px}
.pg-hd h1{margin:0}.pg-k{display:block;font-size:12px;font-weight:500;color:var(--mu)}
.pg-n{font-size:13px;color:var(--mu);white-space:nowrap}.pg-n b{color:var(--tx)}
.hm-h{margin:18px 2px 8px}
.hm-head{display:flex;align-items:center;justify-content:space-between;margin:18px 2px 8px}.hm-head h2{margin:0}
.hm-list{padding:0;overflow:hidden}
.hm-row{display:flex;align-items:center;gap:12px;width:100%;min-height:62px;padding:10px 14px;margin:0;border:0;border-radius:0;background:none;text-align:left;font:inherit;color:inherit}
.hm-row+.hm-row{border-top:1px solid var(--bd)}
.hm-d{flex:0 0 38px;text-align:center;font-size:10px;font-weight:700;color:var(--mu);text-transform:uppercase}
.hm-d b{display:block;font:700 21px/1 var(--num);color:var(--tx)}
/* loghi nella scheda partita: cerchio con lo stesso fondo delle partite in Home */
.mscore .tm .crest.mlg{width:56px;height:56px;border-radius:50%;border:0;padding:0;background:color-mix(in srgb,var(--tx) 7%,var(--sf));object-fit:cover;display:grid;place-items:center;font:700 18px var(--ui);color:var(--mu)}
.mscore .tm .crest.mlg .ic{width:50%;height:50%}
.hm-lg{flex:none;width:34px!important;height:34px!important;border-radius:50%!important;border:0!important;padding:0!important;background:color-mix(in srgb,var(--tx) 7%,var(--sf))!important;font:700 11px var(--ui)!important;color:var(--mu)!important;object-fit:cover}
.hm-t{flex:1;min-width:0;display:flex;flex-direction:column}
.hm-t b{font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hm-t span{font-size:12px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hm-s{flex:none;font:800 22px/1 var(--num);padding:4px 9px;border-radius:8px}
.hm-s.v{background:color-mix(in srgb,var(--win) 15%,var(--sf));color:var(--win)}
.hm-s.n{background:color-mix(in srgb,var(--tx) 8%,var(--sf));color:var(--tx)}
.hm-s.p{background:color-mix(in srgb,var(--loss) 15%,var(--sf));color:var(--loss)}
.hm-s small{display:block;font:700 10px/1.2 var(--ui);text-align:center;margin-top:2px;opacity:.85}
.hm-u{flex:none;font-size:12px;font-weight:700;color:var(--ac)}
.hm-more{display:block;width:100%;min-height:44px;margin:0;border:0;background:none;color:var(--ac);font-weight:600;font-size:14px}
.hm-new{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:46px;margin:0 0 4px;border:1.5px dashed var(--bd);background:none;color:var(--ac)}
.rs-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -14px 12px;padding:0 14px}.rs-chips::-webkit-scrollbar{display:none}
.rs-chips button{flex:none;min-height:36px;padding:0 14px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;background:var(--sf);color:var(--tx);border:1px solid var(--bd)}
.rs-chips button.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.rs-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media (min-width:600px){.rs-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.rs-grid .card{margin:0}.rs-h{margin:16px 2px 8px}.rs-chips+.rs-h{margin-top:4px}.rs-grid .fut+.mu{display:none}
.cl-seg{display:flex;gap:2px;padding:4px;border-radius:14px;background:color-mix(in srgb,var(--tx) 8%,var(--bg));overflow-x:auto;scrollbar-width:none;margin:0 0 8px}.cl-seg::-webkit-scrollbar{display:none}
.cl-seg button{flex:1 0 auto;min-height:38px;padding:0 10px;border:0;border-radius:10px;background:transparent;color:var(--mu);font-size:13px;font-weight:700}
.cl-seg button.on{background:var(--sf);color:var(--ac);box-shadow:0 1px 3px rgba(20,23,31,.15)}
.cl-pod{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:end;gap:8px;padding:18px 0 0}
.cl-p{display:flex;flex-direction:column;align-items:center;min-width:0}
.cl-av{width:48px;height:48px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:color-mix(in srgb,var(--acf) 18%,var(--sf));color:var(--ac);font:800 15px var(--ui);border:3px solid var(--sf);flex:none}
.cl-av img{width:100%;height:100%;object-fit:cover}
.cl-p1 .cl-av{width:58px;height:58px;border-color:var(--hl)}
.cl-pn{font-size:14px;margin-top:6px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cl-st{width:100%;margin-top:8px;border-radius:14px 14px 0 0;display:flex;flex-direction:column;align-items:center;padding-top:8px;background:color-mix(in srgb,var(--tx) 7%,var(--sf));color:var(--tx)}
.cl-st b{font:800 30px/1 var(--num)}.cl-st span{font-size:11px;font-weight:700;opacity:.75}
.cl-p1 .cl-st{height:96px;background:var(--acf);color:var(--on)}.cl-p2 .cl-st{height:72px;background:color-mix(in srgb,var(--acf) 16%,var(--sf));color:var(--ac)}.cl-p3 .cl-st{height:56px}
.cl-list{padding:0;border-radius:0 0 18px 18px;overflow:hidden}.cl-list.solo{border-radius:18px;margin-top:6px}
.cl-r{display:flex;align-items:center;gap:12px;width:100%;margin:0;padding:11px 14px;border:0;border-radius:0;background:none;text-align:left;font:inherit;color:inherit}
.cl-r+.cl-r{border-top:1px solid var(--bd)}
.cl-k{width:20px;font:700 17px var(--num);color:var(--mu)}
.cl-av.sm{width:32px;height:32px;border-width:0;font-size:12px}
.cl-n{flex:1;min-width:0;display:flex;flex-direction:column}.cl-n b{font-size:14px;font-weight:600}
.cl-n>i{display:block;height:5px;border-radius:3px;background:color-mix(in srgb,var(--tx) 8%,var(--sf));margin-top:5px}.cl-n>i>i{display:block;height:5px;border-radius:3px;background:var(--acf)}
.cl-v{min-width:30px;text-align:right;font:800 20px var(--num)}
.io-tl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}
.io-tl>div{background:var(--sf);border:1px solid var(--bd);border-radius:14px;padding:10px 2px;text-align:center}
.io-tl b{display:block;font:800 26px/1 var(--num)}.io-tl span{display:block;margin-top:3px;font-size:10px;font-weight:700;letter-spacing:.04em;color:var(--mu)}
.io-ch,.io-bil{padding:14px}.io-ch h2,.io-bil h2{margin:0}
.io-chh{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.io-chh span{font-size:12px;font-weight:700;color:var(--ac)}
.io-ch svg{display:block;margin-top:8px;overflow:visible}.io-ch line{stroke:var(--bd)}
.io-ch polyline{fill:none;stroke:var(--acf);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
.io-ch circle{fill:var(--hl);stroke:var(--acf);stroke-width:2.5}
.io-bar{display:flex;gap:2px;height:14px;border-radius:7px;overflow:hidden;margin:10px 0 8px}
.io-bar i.v{background:var(--win)}.io-bar i.n{background:var(--draw)}.io-bar i.p{background:var(--loss)}
.io-bl{display:flex;align-items:center;gap:14px;font-size:13px;color:var(--mu)}.io-bl b{color:var(--tx)}.io-bl b.v{color:var(--win)}.io-bl b.p{color:var(--loss)}
.io-pct{margin-left:auto;color:var(--tx)!important}
.io-tg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}
.io-tg>div{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;padding:10px 6px;border-radius:14px;background:var(--sf);border:1px solid var(--bd);color:var(--mu)}
.io-tg .ic{width:22px;height:22px}.io-tg b{font-size:12px;color:var(--tx);line-height:1.15}.io-tg span{font-size:10.5px;line-height:1.2}
.io-tg>div.on{background:var(--acf);border-color:var(--acf);color:color-mix(in srgb,var(--on) 80%,transparent)}.io-tg>div.on b{color:var(--on)}.io-tg>div.on .ic{color:var(--hl)}
`;document.head.append(st);
// Aprire una partita da qualsiasi scheda (la scheda della partita si vede solo dalla Home):
// si ricordano scheda e posizione, così "indietro" riporta esattamente lì.
W0.openMatch=function(id){const el=S.pd?document.querySelector('.pm'):document.querySelector('.view');
  S.ret={mid:id,pd:S.pd,tab:S.tab,sc:el?el.scrollTop:0};S.pd=null;if(S.tab!=='home'&&S.tab!=='cal')S.tab='home';S.mid=id;S.mt=null;W0.__lastMid=id;render()};
// Tornare indietro da una partita riporta alla pagina da cui la si è aperta, nello stesso punto:
// quando si apre una partita (da qualsiasi scheda) si ricordano scheda e posizione, e "indietro" le ripristina.
const r0=W0.render;
W0.render=function(){
  try{if(S.mid&&S.mid!==W0.__lastMid&&!(S.ret&&S.ret.mid===S.mid)){const el=S.pd?document.querySelector('.pm'):document.querySelector('.view');
    if(!W0.__lastMid)S.ret={mid:S.mid,tab:S.tab,pd:S.pd,sc:el?el.scrollTop:0}}
    W0.__lastMid=S.mid||null}catch(e){}
  return r0.apply(this,arguments)};
// se l'app ha già disegnato la prima schermata prima di questo file, la ridisegna
try{if(S.db)render()}catch(e){}
})();
