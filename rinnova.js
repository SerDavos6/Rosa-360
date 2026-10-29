// ===== Rinnova: nuovo aspetto + home "serata di partita". Per tornare indietro basta togliere questo file e la riga <script> in index.html =====
(function(){const st=document.createElement('style');st.textContent=`
.card{border-radius:22px;transition:transform .15s ease}
.card:active{transform:scale(.985)}
.view .pg>.card,.view .pg>div>.card{animation:rnUp .38s cubic-bezier(.2,.7,.2,1) both}
@keyframes rnUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
h1{font-size:30px;letter-spacing:-.01em}
.bn{margin:0 10px calc(8px + env(safe-area-inset-bottom,0px));padding:5px;border:1px solid var(--bd);border-radius:26px;background:color-mix(in srgb,var(--sf) 80%,transparent);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);box-shadow:0 10px 30px -10px rgba(0,0,0,.45)}
.bn button{border-radius:20px;transition:background .2s,color .2s}
.bn button.on{background:var(--ac2);color:var(--ac)}
.bn .on::before{display:none}
.rn-hero{padding:22px 20px 18px;border-radius:28px}
.rn-hero .rn-cd{display:flex;align-items:baseline;gap:8px;margin-top:6px}
.rn-hero .rn-cd b{font:700 68px/1 var(--num);letter-spacing:.01em}
.rn-hero .rn-cd span{font-size:15px;font-weight:700;opacity:.85}
.rn-hero .hd{font-size:30px}
.rn-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px}
.rn-pill{padding:7px 12px;border-radius:999px;background:rgba(0,0,0,.2);font-size:13px;font-weight:700}
.rn-in{min-height:46px;padding:0 20px;border:0;border-radius:999px;background:rgba(255,255,255,.92);color:#111;font-weight:800;font-size:16px;box-shadow:0 6px 16px -6px rgba(0,0,0,.5)}
.rn-in.on{background:#fff;color:#0b7a43}
.fut{transition:transform .2s ease,box-shadow .2s ease}.fut:active{transform:scale(.97)}
.chip{border-radius:999px}
@media (prefers-reduced-motion:reduce){.view .pg>.card,.view .pg>div>.card{animation:none}.card,.fut{transition:none}}
`;document.head.append(st);
window.nextMatch=function(ms){
  const n=new Date(),p=v=>String(v).padStart(2,"0"),ds=n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate());
  const x=ms.filter(m=>!m.played&&m.date>=ds).sort((a,b)=>a.date<b.date?-1:1)[0];if(!x)return"";
  const d=matchDetail(x),dd=Math.round((new Date(x.date+"T12:00")-new Date(ds+"T12:00"))/864e5),
    big=dd===0?"OGGI":dd===1?"DOMANI":dd,unit=dd>1?"giorni":"",me=myMember(),pr=x.present||[],isIn=!!me&&pr.includes(me.id),
    cnt=S.members.filter(m=>m.tid===x.tid&&m.role==="giocatore"&&pr.includes(m.id)).length;
  return `<div class="card nxt rn-hero" onclick="S.mid='${x.id}';render()"><div class="eb">Prossima partita</div><div class="rn-cd"><b>${big}</b><span>${unit}</span></div><div class="hd">vs ${esc(x.opp)}</div><div class="mu">${esc(dt(x.date).f)}${d.time?" · "+esc(d.time):""}${d.location?" · "+esc(d.location):""}</div><div class="rn-row"><span class="rn-pill">${cnt} confermat${cnt===1?"o":"i"}</span>${me?`<button class="rn-in ${isIn?"on":""}" onclick="event.stopPropagation();myPresence('${x.id}','${me.id}',${!isIn})">${isIn?"✓ Ci sono":"Ci sei?"}</button>`:""}</div></div>`};
})();
