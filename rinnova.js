// ===== Scheda "Prossima partita" grande, con confermati e tasto "Ci sono". Per toglierla basta togliere questo file e la riga <script> in index.html =====
(function(){const st=document.createElement('style');st.textContent=`
.rn-hero{padding:18px 18px 14px;border-radius:24px;background:#0b7a43;color:#fff;border:0}
.rn-hero .eb{color:inherit;opacity:.9}
.rn-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.rn-pill{padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.18);font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}
.rn-vs{display:flex;align-items:center;gap:8px;margin:16px 0 14px}
.rn-vs>div{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.rn-vs b{font-size:15px;font-weight:800;line-height:1.15;overflow-wrap:anywhere}
.rn-x{font:600 22px var(--num);opacity:.8}
.rn-lg{width:54px;height:54px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.18);display:grid;place-items:center;font:700 18px var(--num)}
.rn-lg.me{background:#fff;color:#0b7a43}
img.rn-lg{background:#fff}
.rn-dt{display:flex;align-items:center;gap:8px;font-size:13px;opacity:.95}.rn-dt .ic{flex:none}
.rn-go{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:50px;margin-top:14px;border:0;border-radius:14px;background:#fff;color:#0b7a43;font-weight:800;font-size:15px}
.rn-go .ic{width:18px;height:18px}
.rn-go.on{background:rgba(255,255,255,.22);color:#fff}
.rn-cnt{text-align:center;font-size:12px;opacity:.85;margin-top:8px}
`;document.head.append(st);
const installa=()=>{window.nextMatch=function(ms){
  const n=new Date(),p=v=>String(v).padStart(2,"0"),ds=n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate());
  const x=ms.filter(m=>!m.played&&m.date>=ds).sort((a,b)=>a.date<b.date?-1:1)[0];if(!x)return"";
  const d=matchDetail(x),dd=Math.round((new Date(x.date+"T12:00")-new Date(ds+"T12:00"))/864e5),
    when=dd===0?"Oggi":dd===1?"Domani":"Tra "+dd+" giorni",me=myMember(),pr=x.present||[],isIn=!!me&&pr.includes(me.id),
    cnt=matchRoster(x).filter(m=>m.role==="giocatore"&&pr.includes(m.id)).length,mgr=!S.fan&&typeof canManage==="function"&&canManage(),
    T=S.teams.find(t=>t.id===x.tid)||{},ini=s=>esc(String(s||"?").replace(/[^A-Za-z0-9À-ÿ ]/g,"").split(/\s+/).filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?");
  const logo=(src,name,mine)=>src?`<img class="rn-lg" src="${safeSrc(src)}" alt="">`:`<span class="rn-lg${mine?" me":""}">${ini(name)}</span>`;
  const ph=[matchPhase(x)||x.tourn,when].filter(Boolean).join(" · ");
  const play='<svg class="ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l12 8-12 8z"/></svg>';
  // dirigente: avvia la diretta · giocatore: conferma la presenza · tifoso: apre la partita
  const btn=mgr?`<button class="rn-go" onclick="event.stopPropagation();S.mid='${x.id}';render()">${play} Avvia la diretta</button>`
    :me?`<button class="rn-go${isIn?" on":""}" onclick="event.stopPropagation();myPresence('${x.id}','${me.id}',${!isIn})">${isIn?"✓ Ci sono":"Ci sei? Conferma la presenza"}</button>`
    :`<button class="rn-go" onclick="event.stopPropagation();S.mid='${x.id}';render()">Vai alla partita</button>`;
  return `<div class="card nxt rn-hero" onclick="S.mid='${x.id}';render()">
  <div class="rn-top"><span class="eb">Prossima partita</span><span class="rn-pill">${esc(ph)}</span></div>
  <div class="rn-vs"><div>${logo(T.logo,T.name,true)}<b>${esc(T.name||"Noi")}</b></div><span class="rn-x">VS</span><div>${logo(x.oppLogo,x.opp)}<b>${esc(x.opp)}</b></div></div>
  <div class="rn-dt">${ic("cal")}<span>${esc(dt(x.date).f)}${d.time?" · "+esc(d.time):""}${matchPlace(x)?" · "+esc(matchPlace(x)):""}</span></div>
  ${btn}${me?`<div class="rn-cnt">${cnt} confermat${cnt===1?"o":"i"}</div>`:""}</div>`}};
// la pagina ridefinisce nextMatch mentre si carica: lo sostituisco a caricamento finito
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installa);else installa();
})();
