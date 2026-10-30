// ===== Scheda "Prossima partita" grande, con confermati e tasto "Ci sono". Per toglierla basta togliere questo file e la riga <script> in index.html =====
(function(){const st=document.createElement('style');st.textContent=`
.rn-hero{padding:22px 20px 18px;border-radius:28px}
.rn-hero .rn-cd{display:flex;align-items:baseline;gap:8px;margin-top:6px}
.rn-hero .rn-cd b{font:700 68px/1 var(--num);letter-spacing:.01em}
.rn-hero .rn-cd span{font-size:15px;font-weight:700;opacity:.85}
.rn-hero .hd{font-size:30px}
.rn-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px}
.rn-pill{padding:7px 12px;border-radius:999px;background:rgba(0,0,0,.2);font-size:13px;font-weight:700}
.rn-in{min-height:46px;padding:0 20px;border:0;border-radius:999px;background:rgba(255,255,255,.92);color:#111;font-weight:800;font-size:16px;box-shadow:0 6px 16px -6px rgba(0,0,0,.5)}
.rn-in.on{background:#fff;color:#0b7a43}
`;document.head.append(st);
const installa=()=>{window.nextMatch=function(ms){
  const n=new Date(),p=v=>String(v).padStart(2,"0"),ds=n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate());
  const x=ms.filter(m=>!m.played&&m.date>=ds).sort((a,b)=>a.date<b.date?-1:1)[0];if(!x)return"";
  const d=matchDetail(x),dd=Math.round((new Date(x.date+"T12:00")-new Date(ds+"T12:00"))/864e5),
    big=dd===0?"OGGI":dd===1?"DOMANI":dd,unit=dd>1?"giorni":"",me=myMember(),pr=x.present||[],isIn=!!me&&pr.includes(me.id),
    cnt=S.members.filter(m=>m.tid===x.tid&&m.role==="giocatore"&&pr.includes(m.id)).length;
  return `<div class="card nxt rn-hero" onclick="S.mid='${x.id}';render()"><div class="eb">Prossima partita</div><div class="rn-cd"><b>${big}</b><span>${unit}</span></div><div class="hd">vs ${esc(x.opp)}</div><div class="mu">${esc(dt(x.date).f)}${d.time?" · "+esc(d.time):""}${matchPlace(x)?" · "+esc(matchPlace(x)):""}</div><div class="rn-row"><span class="rn-pill">${cnt} confermat${cnt===1?"o":"i"}</span>${me?`<button class="rn-in ${isIn?"on":""}" onclick="event.stopPropagation();myPresence('${x.id}','${me.id}',${!isIn})">${isIn?"✓ Ci sono":"Ci sei?"}</button>`:""}</div></div>`}};
// la pagina ridefinisce nextMatch mentre si carica: lo sostituisco a caricamento finito
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installa);else installa();
})();
