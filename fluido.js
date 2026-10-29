// ===== Fluidità e aspetto =====
// Avvio giallo, salvataggio istantaneo, gesti (indietro, tira per aggiornare),
// dimensione del testo e tasti grandi, scorciatoie dall'icona.

// ---------- stile ----------
(function(){const st=document.createElement('style');st.textContent=`
#boot{position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:#fdd30b;pointer-events:none;transition:opacity .3s ease}
#boot img{width:132px;height:132px;border-radius:30px;box-shadow:0 10px 30px rgba(0,0,0,.18);animation:bootp 1.4s ease-in-out infinite}
#boot.off{opacity:0}
@keyframes bootp{50%{transform:scale(1.05)}}
#ptr{position:fixed;left:50%;top:0;z-index:80;width:40px;height:40px;margin-left:-20px;border-radius:50%;background:var(--sf);border:1px solid var(--bd);box-shadow:0 4px 14px rgba(0,0,0,.25);display:grid;place-items:center;opacity:0;pointer-events:none;color:var(--ac);font-size:20px;font-weight:800}
#ptr.spin::after{content:"";width:18px;height:18px;border:3px solid var(--bd);border-top-color:var(--ac);border-radius:50%;animation:ptrs .7s linear infinite}
@keyframes ptrs{to{transform:rotate(360deg)}}
button:not(:disabled),.mrow,.hero2,.nxt,.tcard{transition:transform .08s ease,opacity .15s ease}
button:not(:disabled):active,.mrow:active,.hero2:active,.nxt:active,.tcard:active{transform:scale(.97)}
html.tx1 .pg{zoom:1.12}
html.tx2 .pg{zoom:1.25}
html.bigtap{--navh:72px}
html.bigtap button,html.bigtap select,html.bigtap input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=color]){min-height:52px}
html.bigtap button.s{min-height:48px}
html.bigtap .ib{width:50px;height:50px;min-height:50px}
html.bigtap .mtabs button{min-height:54px}
html.bigtap input[type=checkbox],html.bigtap input[type=radio]{transform:scale(1.35);margin:4px}

@media (prefers-reduced-motion:reduce){#boot img{animation:none}button,.mrow,.hero2,.nxt,.tcard{transition:none}button:active,.mrow:active,.hero2:active,.nxt:active,.tcard:active{transform:none}}
`;document.head.append(st)})();

// ---------- dimensione del testo e tasti grandi (solo su questo telefono) ----------
function getTxt(){try{return Math.min(2,Math.max(0,+localStorage.getItem('txt')||0))}catch(e){return 0}}
function getBig(){try{return localStorage.getItem('bigtap')==='1'}catch(e){return false}}
function applyView(){const c=document.documentElement.classList;c.remove('tx1','tx2','bigtap');const t=getTxt();if(t)c.add('tx'+t);if(getBig())c.add('bigtap')}
function setTxt(n){try{localStorage.setItem('txt',n)}catch(e){}applyView();render()}
function setBig(on){try{localStorage.setItem('bigtap',on?'1':'0')}catch(e){}applyView();render()}
function aspettoExtra(){
  const seg=(items,cur,fn)=>`<div class="seg">${items.map(([k,n])=>`<button class="${cur===k?'on':''}" onclick="${fn}(${k})">${n}</button>`).join('')}</div>`;
  return `<div style="margin-top:16px"><b>Dimensione del testo</b></div>${seg([[0,'Normale'],[1,'Grande'],[2,'Molto grande']],getTxt(),'setTxt')}
<div style="margin-top:16px"><b>Tasti</b></div>${seg([[0,'Standard'],[1,'Più grandi']],getBig()?1:0,'setBig').replace(/setBig\(0\)/,'setBig(false)').replace(/setBig\(1\)/,'setBig(true)')}`}
applyView();

// ---------- salvataggio istantaneo ----------
// Il cambiamento compare subito sullo schermo; se il salvataggio fallisce torna com'era e l'app mostra l'errore di sempre.
function fluidDb(db){
  const MAP={teams:'teams',members:'members',requests:'reqs',matches:'matches'};
  const redraw=()=>{if(redraw.t)return;redraw.t=requestAnimationFrame(()=>{redraw.t=0;try{render()}catch(e){}})};
  const live=c=>c==='matches'&&typeof lvBusy==='function'&&lvBusy(); // durante la partita in diretta ci pensa già la sua coda
  return {collection:(...a)=>db.collection(...a),
    doc:p=>{const d=db.doc(p),[c,id]=p.split('/'),k=MAP[c];if(!k)return d;
      return {...d,
        set:async data=>{
          if(live(c)||(S[k]||[]).some(x=>x.id===id))return d.set(data);
          const add={id,...data};S[k]=[...(S[k]||[]),add];redraw();
          try{return await d.set(data)}catch(e){S[k]=(S[k]||[]).filter(x=>x!==add);redraw();throw e}},
        update:async data=>{
          const o=live(c)?null:(S[k]||[]).find(x=>x.id===id);
          if(!o)return d.update(data);
          const prev={};Object.keys(data).forEach(key=>{prev[key]=[key in o,o[key]]});
          Object.assign(o,data);redraw();
          try{return await d.update(data)}catch(e){
            const o2=(S[k]||[]).find(x=>x.id===id);
            if(o2)Object.keys(prev).forEach(key=>{const[h,v]=prev[key];if(h)o2[key]=v;else delete o2[key]});
            redraw();throw e}},
        delete:async()=>{
          const o=live(c)?null:(S[k]||[]).find(x=>x.id===id);
          if(!o)return d.delete();
          S[k]=S[k].filter(x=>x!==o);redraw();
          try{return await d.delete()}catch(e){if(!(S[k]||[]).some(x=>x.id===id)){S[k]=[...S[k],o];redraw()}throw e}}}}}}

// ---------- tutto il resto parte quando la pagina è pronta ----------
function fluidoStart(){
  // Avvio giallo con il logo, finché compare la prima schermata vera.
  const boot=document.createElement('div');boot.id='boot';try{const c=localStorage.getItem('bar');if(/^#[0-9a-f]{6}$/i.test(c||''))boot.style.background=c}catch(e){}boot.innerHTML='<img src="icon-192.png" alt="">';document.body.append(boot);
  const t0=Date.now();let gone=false;
  const hide=()=>{if(gone)return;gone=true;setTimeout(()=>{boot.classList.add('off');setTimeout(()=>boot.remove(),350)},Math.max(0,450-(Date.now()-t0)))};
  const app=document.getElementById('app');
  const mo=new MutationObserver(()=>{if(app.querySelector('.pg:not([aria-busy])'))hide()});
  mo.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-busy']});
  setTimeout(hide,5000);if(app.querySelector('.pg:not([aria-busy])'))hide();

  // Scorciatoie dall'icona (?v=cal|rosa|cls) e richiamo di sincronizzazione della barra indietro.
  const qv=new URLSearchParams(location.search).get('v');let sc=!['cal','rosa','cls'].includes(qv);
  let pushed=false,tm=0;
  const open=()=>!!(S.mid||S.pd||document.getElementById('sheet'));
  const sync=()=>{clearTimeout(tm);tm=setTimeout(()=>{const o=open();
    if(o&&!pushed){try{history.pushState({sq:1},'')}catch(e){}pushed=true}
    else if(!o&&pushed){pushed=false;try{if(history.state&&history.state.sq)history.back()}catch(e){}}},40)};
  const goBack=()=>{ // un livello indietro: pannello, poi carta giocatore, poi partita
    if(document.getElementById('sheet')){closeSheet();return true}
    if(S.pd){S.pd=null;render();return true}
    if(S.mid){S.mid=null;S.mt=null;render();return true}
    return false};
  window.addEventListener('popstate',()=>{if(!pushed)return;pushed=false;goBack();sync()});

  // La barra in alto del telefono segue sempre il colore dell'intestazione; l'ultimo colore viene ricordato per il prossimo avvio.
  const sb0=syncBar;let lastBar='';
  syncBar=function(){sb0.apply(this,arguments);const m=document.querySelector('meta[name=theme-color]'),c=m&&m.getAttribute('content');
    if(!c||c===lastBar||!/^#[0-9a-f]{6}$/i.test(c))return;lastBar=c;try{localStorage.setItem('bar',c)}catch(e){}
    const n=m.cloneNode();n.setAttribute('content',c);m.replaceWith(n)};
  const r0=render;
  render=function(){
    if(!sc&&S.profile&&S.teams.length&&S.members.length){sc=true;S.tab=qv;S.mid=null;S.pd=null;try{history.replaceState({},document.title,location.pathname)}catch(e){}}
    const out=r0.apply(this,arguments);sync();return out};
  const s0=sheet,c0=closeSheet;
  sheet=function(){const r=s0.apply(this,arguments);sync();return r};
  closeSheet=function(){const r=c0.apply(this,arguments);sync();return r};

  // Gesti: dal bordo sinistro verso destra = indietro; dall'alto verso il basso = aggiorna.
  let g=null;
  const typing=()=>{const a=document.activeElement;return a&&a.matches&&a.matches('input,textarea,select')};
  document.addEventListener('touchstart',e=>{
    if(e.touches.length!==1){g=null;return}
    const t=e.touches[0],v=document.querySelector('#app .view');
    g={x:t.clientX,y:t.clientY,edge:t.clientX<=24&&open(),pull:!!v&&v.scrollTop<=0&&!open()&&!S.mid&&!e.target.closest('.fmrow,.mtabs,.seg'),dy:0,mode:''}},{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!g)return;const t=e.touches[0],dx=t.clientX-g.x,dy=t.clientY-g.y;
    if(!g.mode){if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
      g.mode=g.edge&&dx>0&&Math.abs(dx)>Math.abs(dy)?'back':g.pull&&dy>0&&dy>Math.abs(dx)&&!typing()&&!lvBusyNow()?'pull':'x'}
    if(g.mode==='pull'){g.dy=dy;const p=document.getElementById('ptr')||(()=>{const n=document.createElement('div');n.id='ptr';n.textContent='↓';document.body.append(n);return n})();
      const h=Math.min(dy,120);p.style.opacity=Math.min(1,h/70);p.style.transform=`translateY(${Math.min(h*.8,84)+8}px) rotate(${h*3}deg)`;p.style.top='env(safe-area-inset-top,0px)';p.textContent=h>=80?'↑':'↓'}},{passive:true});
  document.addEventListener('touchend',e=>{
    if(!g)return;const t=e.changedTouches[0],dx=t.clientX-g.x,dy=t.clientY-g.y,m=g.mode;g=null;
    if(m==='back'&&dx>80&&Math.abs(dy)<70){if(pushed){history.back()}else goBack()}
    const p=document.getElementById('ptr');
    if(m==='pull'){if(dy>=80){p.textContent='';p.classList.add('spin');p.style.opacity=1;p.style.transform='translateY(60px)';Promise.all([window.refreshAll?refreshAll():0,new Promise(r=>setTimeout(r,600))]).catch(()=>{}).finally(()=>{const q=document.getElementById('ptr');if(q)q.remove()})}else if(p){p.remove()}}
    else if(p&&!p.classList.contains('spin'))p.remove()},{passive:true});
  document.addEventListener('touchcancel',()=>{g=null;const p=document.getElementById('ptr');if(p&&!p.classList.contains('spin'))p.remove()},{passive:true});
}
const lvBusyNow=()=>typeof lvBusy==='function'&&lvBusy();
