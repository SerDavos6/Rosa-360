// ===== Rigori in diretta =====
// Nelle partite che non possono finire pari (fasi finali: sedicesimi, ottavi, quarti, semifinale, finale, altra fase),
// "Fine partita" con il risultato in parità apre la serie dei rigori. Si segna tiro per tiro:
// nostro tiro = chi tira + gol/sbagliato; tiro avversario = chi era in porta + gol subito/parato/fuori.
// I rigori stanno nella partita (campo pens) e si salvano con la stessa coda della diretta (anche senza rete).
// Non cambiano gol, assist e statistiche della stagione.
(function(){
const W0=window;
const KO=x=>!!(x&&x.ph&&x.ph!=='G');
// conteggi della serie
function pk(x){const N=(x&&x.pens&&+x.pens.n)||5,l=((x&&x.pens&&x.pens.l)||[]),n=l.filter(k=>k.s==='n'),a=l.filter(k=>k.s==='a');
  const gn=n.filter(k=>k.ok).length,ga=a.filter(k=>k.ok).length,kn=n.length,ka=a.length;
  // chi ha vinto: nei primi 5 tiri quando l'altra squadra non può più recuperare, poi a oltranza a parità di tiri
  let w=null;
  if(kn<=N&&ka<=N){if(gn+(N-kn)<ga)w='a';else if(ga+(N-ka)<gn)w='n';else if(kn===N&&ka===N&&gn!==ga)w=gn>ga?'n':'a'}
  else if(kn===ka&&gn!==ga)w=gn>ga?'n':'a';
  const first=l.length?l[0].s:null,next=kn===ka?(first||'n'):(kn<ka?'n':'a');
  return {N,l,n,a,gn,ga,kn,ka,w,next}}
// risultato dei rigori per le altre schermate: {h: nostri, a: loro}
W0.pensOf=x=>x&&x.pens&&x.pens.l&&x.pens.l.length?{h:pk(x).gn,a:pk(x).ga}:null;
// esito della partita contando i rigori: v / p / n
W0.pensRes=x=>{const p=W0.pensOf(x);return p&&+x.gf===+x.ga&&p.h!==p.a?(p.h>p.a?'v':'p'):null};

const PK={p:null,gk:null};
const nk=(x,id)=>esc((mbr(x,id)||{}).nick||'?');
const add=(id,k)=>{lvApply(id,d=>{d.pens=d.pens||{l:[]};d.pens.l.push(k)});rq()};
W0.pkShooter=p=>{PK.p=PK.p===p?null:p;rq()};
W0.pkKeeper=g=>{PK.gk=g;rq()};
W0.pkUs=(id,ok)=>{try{navigator.vibrate&&navigator.vibrate(ok?45:[30,40,30])}catch(e){}add(id,{s:'n',p:PK.p||null,ok:!!ok,t:lvNow()});if(ok){try{confetti()}catch(e){}}PK.p=null};
W0.pkThem=(id,ok,how)=>{const x=lvEff(S.matches.find(m=>m.id===id)||{}),gk=PK.gk||lvKeepers(x)[0]||null;try{navigator.vibrate&&navigator.vibrate(45)}catch(e){}add(id,{s:'a',gk,ok:!!ok,how:how||'',t:lvNow()})};
W0.pkSeries=(id,n)=>{lvApply(id,d=>{d.pens=d.pens||{l:[]};d.pens.n=n});rq()};
W0.pkUndo=id=>{lvApply(id,d=>{if(d.pens&&d.pens.l)d.pens.l.pop();if(d.pens&&!d.pens.l.length)d.pens=null});PK.p=null;rq()};
W0.pkStart=id=>{try{closeSheet()}catch(e){}liveClockStop(id);PK.p=null;PK.gk=null;lvApply(id,d=>{d.pens={l:[]}});rq()};
W0.pkEnd=id=>{lvApply(id,d=>{d.played=true});S.fp=id;S.fpSel=null;setTimeout(render,0)};
W0.pkCancel=id=>ask({title:'Annullare i rigori?',msg:'Si cancellano tutti i tiri segnati e si torna alla partita.',ok:'Annulla i rigori',danger:true,fn:()=>{lvApply(id,d=>{d.pens=null});rq()}});

// "Fine partita": in parità in una fase finale si va ai rigori
const endOrig=W0.liveEnd;
W0.liveEnd=function(id){
  const b=S.matches.find(m=>m.id===id),x=b&&lvEff(b);
  if(x&&!x.pens&&+x.gf===+x.ga){
    const ko=KO(x);
    sheet(`<h2 style="margin-top:0">${ko?'Pareggio: si va ai rigori':'È finita in parità'}</h2><p class="mu">${ko?'Questa partita non può finire pari. Segna i rigori uno alla volta: la partita si chiude quando la serie è decisa.':'Se ci sono i rigori, segnali uno alla volta; altrimenti la partita finisce in pareggio.'}</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px"><button class="p" onclick="pkStart('${id}')">Inizia i rigori</button>${ko?'':`<button onclick="closeSheet();liveEndPlain('${id}')">Finisce in pareggio</button>`}<button onclick="closeSheet()">Annulla</button></div>`);
    return}
  endOrig(id)};
W0.liveEndPlain=id=>endOrig(id);

// pannello dei rigori al posto dei tasti della diretta
const cardOrig=W0.liveCardHtml;
W0.liveCardHtml=function(x){
  if(!x.pens||x.played){
    let h=cardOrig(x);
    // partita chiusa con i rigori: sotto la cronaca, il riepilogo della serie (senza comandi)
    if(x.played&&W0.pensOf(x))h+=pkCard(x,false);
    // in parità si possono avviare i rigori anche a mano, in qualsiasi partita
    if(!x.played&&!x.pens&&+x.gf===+x.ga&&(x.events||[]).length&&livePlayers(x).length)h=h.replace('<button class="lvfine"',`<button class="pk-go" onclick="pkStart('${x.id}')">${ic('ball')} Vai ai rigori</button><button class="lvfine"`);
    return h}
  return pkCard(x,true)};
// riepilogo dei rigori in sola lettura (giocatori, tifosi, partita chiusa)
W0.pensCard=x=>W0.pensOf(x)?pkCard(x,false):'';
function pkCard(x,edit){
  const s=pk(x),id=x.id,T=S.teams.find(t=>t.id===x.tid)||{},ps=livePlayers(x),ks=lvKeepers(x);
  const dots=l=>{const k=Math.max(s.N,l.length);let o='';for(let i=0;i<k;i++){const e=l[i];o+=`<i class="${e?(e.ok?'ok':'no'):''}"${e?` title="${e.s==='n'?(e.p?nk(x,e.p):'Tiro'):(e.ok?'Gol':e.how==='fuori'?'Fuori':'Parato')}"`:''}>${e?(e.ok?'✓':'✗'):''}</i>`}return o};
  const gk=PK.gk&&ks.includes(PK.gk)?PK.gk:ks[0];
  const usDone=new Set(s.n.map(k=>k.p).filter(Boolean));
  const won=s.w?(s.w==='n'?esc(T.name||'Noi'):esc(x.opp||'Avversari')):'';
  const panel=s.w?`<div class="pk-win"><b>Vince ${won} ai rigori</b><span>${s.gn} – ${s.ga}</span><button class="p" onclick="pkEnd('${id}')">Chiudi la partita</button></div>`
    :`<div class="pk-turn">Tocca a: <b>${s.next==='n'?esc(T.name||'noi'):esc(x.opp||'avversari')}</b></div>
    <div class="pk-box${s.next==='n'?' on':''}"><div class="pk-bh">Tiro nostro · chi tira?</div>
      <div class="pk-g">${ps.map(m=>`<button class="${PK.p===m.id?'on':''}${usDone.has(m.id)?' done':''}" onclick="pkShooter('${m.id}')"><b>${esc(m.num||'–')}</b><span>${esc(m.nick)}</span></button>`).join('')}</div>
      <div class="pk-two"><button class="p" onclick="pkUs('${id}',true)">${ic('ball')} Gol</button><button class="d" onclick="pkUs('${id}',false)">✗ Sbagliato</button></div></div>
    <div class="pk-box${s.next==='a'?' on':''}"><div class="pk-bh">Tiro ${esc(x.opp||'avversario')} · in porta</div>
      <div class="pk-g">${ks.map(i=>mbr(x,i)).filter(Boolean).map(m=>`<button class="${gk===m.id?'on':''}" onclick="pkKeeper('${m.id}')"><b>${esc(m.num||'–')}</b><span>${esc(m.nick)}</span></button>`).join('')}</div>
      <div class="pk-three"><button class="d" onclick="pkThem('${id}',true)">Gol subito</button><button class="p" onclick="pkThem('${id}',false,'parato')">${ic('glove')} Parato</button><button onclick="pkThem('${id}',false,'fuori')">Fuori</button></div></div>`;
  const log=s.l.map((k,i)=>`<li><span class="pk-n">${i+1}</span><b>${k.s==='n'?esc(T.name||'Noi'):esc(x.opp||'Avversari')}</b><span>${k.s==='n'?(k.p?nk(x,k.p)+' · ':'')+(k.ok?'gol':'sbagliato'):(k.ok?'gol'+(k.gk?' · in porta '+nk(x,k.gk):''):(k.how==='fuori'?'fuori':'parato'+(k.gk?' da '+nk(x,k.gk):'')))}</span><i class="${k.ok?'ok':'no'}">${k.ok?'✓':'✗'}</i></li>`).reverse().join('');
  return `<div class="card pk">
    <div class="pk-hd"><h2>Rigori</h2><span class="pk-sc">${s.gn} – ${s.ga}</span></div>
    ${edit&&!s.w?`<div class="pk-ser">Serie da <button class="${s.N===3?'on':''}" onclick="pkSeries('${id}',3)">3 rigori</button><button class="${s.N===5?'on':''}" onclick="pkSeries('${id}',5)">5 rigori</button></div>`:''}
    <div class="pk-row"><span>${esc(T.name||'Noi')}</span><div class="pk-dots">${dots(s.n)}</div></div>
    <div class="pk-row"><span>${esc(x.opp||'Avversari')}</span><div class="pk-dots">${dots(s.a)}</div></div>
    ${edit?panel:''}
    ${edit?`<div class="pk-ft"><button class="s" onclick="pkUndo('${id}')" ${s.l.length?'':'disabled'}>${ic('undo')} Annulla ultimo tiro</button><button class="s" onclick="pkCancel('${id}')">Esci dai rigori</button></div>`:''}
    ${log?`<ol class="pk-log">${log}</ol>`:''}</div>`}

const st=document.createElement('style');st.textContent=`
.pk{padding:14px}.pk-hd{display:flex;align-items:baseline;justify-content:space-between}.pk-hd h2{margin:0}
.pk-sc{font:800 34px/1 var(--num)}
.pk-row{display:flex;align-items:center;gap:10px;margin-top:10px}.pk-row>span{flex:0 0 34%;min-width:0;font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-dots{display:flex;flex-wrap:wrap;gap:5px}.pk-dots i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:13px;font-weight:800;border:2px solid var(--bd);color:#fff}
.pk-dots i.ok{background:var(--win,#16a34a);border-color:transparent}.pk-dots i.no{background:var(--loss,#dc2626);border-color:transparent}
.pk-ser{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:13px;color:var(--mu)}.pk-ser button{min-height:34px;padding:0 12px;border-radius:999px;font-size:13px}.pk-ser button.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.pk-turn{margin:14px 0 8px;font-size:14px;color:var(--mu)}.pk-turn b{color:var(--tx)}
.pk-box{border:1.5px solid var(--bd);border-radius:16px;padding:10px;margin-top:8px;opacity:.7}.pk-box.on{opacity:1;border-color:var(--acf)}
.pk-bh{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mu);margin-bottom:8px}
.pk-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.pk-g button{min-height:50px;padding:4px;border-radius:12px;border:1.5px solid var(--bd);background:var(--bg);color:var(--tx);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.pk-g button b{font:800 16px/1 var(--num)}.pk-g button span{font-size:12px;font-weight:600;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-g button.done{opacity:.55}.pk-g button.on{opacity:1;background:var(--acf);color:var(--on);border-color:var(--acf)}
.pk-two,.pk-three{display:grid;gap:8px;margin-top:10px}.pk-two{grid-template-columns:1fr 1fr}.pk-three{grid-template-columns:1fr 1fr 1fr}
.pk-two button,.pk-three button{min-height:52px;font-weight:800}
.pk-win{margin-top:14px;padding:14px;border-radius:16px;background:color-mix(in srgb,var(--acf) 14%,var(--sf));display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.pk-win b{font-size:17px}.pk-win span{font:800 28px/1 var(--num)}.pk-win button{width:100%;min-height:52px;margin-top:6px}
.pk-ft{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.pk-ft button:last-child{margin-left:auto;color:var(--mu)}
.pk-log{list-style:none;margin:12px 0 0;padding:0;border-top:1px solid var(--bd)}
.pk-log li{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--bd);font-size:13px}
.pk-log .pk-n{width:18px;color:var(--mu);font-weight:700}.pk-log b{flex:0 0 auto;max-width:38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pk-log li>span:not(.pk-n){flex:1;min-width:0;color:var(--mu)}
.pk-log i{font-style:normal;font-weight:800}.pk-log i.ok{color:var(--win,#16a34a)}.pk-log i.no{color:var(--loss,#dc2626)}
.pk-go{width:100%;min-height:48px;display:flex;align-items:center;justify-content:center;gap:8px}
.mres.pk{display:block;margin-top:4px}
`;document.head.append(st);
try{if(S.db)render()}catch(e){}
})();
