// ===== Stile e funzioni extra: pannelli dal basso, ricerca rosa, andamento, offline, installazione =====
(function(){const st=document.createElement('style');st.textContent=`.splash{display:grid;place-items:center;gap:10px;min-height:70vh;text-align:center}.splash img{border-radius:24px;animation:spl 1.4s ease-in-out infinite}@keyframes spl{50%{transform:scale(1.07);opacity:.75}}
#offline{position:fixed;top:0;left:0;right:0;z-index:90;padding:calc(6px + env(safe-area-inset-top,0px)) 12px 6px;background:#b3261e;color:#fff;text-align:center;font-size:13px;font-weight:600}
.fmrow{display:flex;gap:6px;overflow-x:auto;margin-top:8px;padding-bottom:4px}.fmx{flex:1 0 56px;min-width:56px;border-radius:12px;padding:8px 4px;text-align:center;color:#0b1220}.fmx b{display:block;font-size:17px}.fmx span{font-size:10.5px;font-weight:600;opacity:.8}.fmx.v{background:#34d399}.fmx.n{background:#fbbf24}.fmx.p{background:#f87171}
.a2hs{position:fixed;left:12px;right:12px;bottom:calc(var(--navh,64px) + env(safe-area-inset-bottom,0px) + 12px);max-width:560px;margin:0 auto;z-index:55;display:flex;align-items:center;gap:8px;background:var(--sf);color:var(--tx);border:1px solid var(--bd);border-radius:16px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.3)}.a2hs span{flex:1;font-weight:600;font-size:14px}
.lvclk{display:flex;align-items:center;gap:8px;margin:8px 0}.lvclk b{font-size:26px;font-variant-numeric:tabular-nums;margin-right:auto}.stps{padding-left:20px;line-height:1.7}`;document.head.append(st)})();

// Pannello dal basso (resta fuori da #app, quindi non sparisce quando l'app si ridisegna).
function sheet(html){closeSheet();const w=document.createElement('div');w.className='pmw';w.id='sheet';w.style.zIndex=70;w.innerHTML='<div class="pm" role="dialog" aria-modal="true">'+html+'</div>';w.onclick=e=>{if(e.target===w)closeSheet()};document.body.append(w);return w}
function closeSheet(){document.getElementById('sheet')?.remove()}
function sheetErr(m){const e=document.getElementById('sheet-err');if(e)e.textContent=m}
function ask(o){window._askFn=o.fn;sheet(`<h2 style="margin-top:0">${o.title}</h2>${o.msg?`<p class="mu">${o.msg}</p>`:''}<div class="row" style="margin-top:14px"><button class="${o.danger?'d':'p'}" onclick="const f=window._askFn;closeSheet();f&&f()">${o.ok||'Conferma'}</button><button onclick="closeSheet()">Annulla</button></div>`)}

// Modifica carta in un pannello: la rosa resta dov'era.
function openEdit(id){const m=S.members.find(x=>x.id===id);if(!m)return;S.pd=null;photoData=null;render();sheet(editCard(m))}

// "Diventa giocatore": ruolo e numero nel pannello, senza finestre di sistema.
let _bp={};
function becomePlayer(id){const m=S.members.find(x=>x.id===id);if(!m)return;_bp={id,pos:POS[m.pos]?m.pos:(POS[S.profile?.pos]?S.profile.pos:'C')};
  sheet(`<h2 style="margin-top:0">Diventa giocatore</h2><label>Ruolo in campo</label><div class="seg" id="bp-pos">${Object.entries(POS).map(([k,n])=>`<button type="button" data-k="${k}" class="${k===_bp.pos?'on':''}" onclick="_bp.pos='${k}';document.querySelectorAll('#bp-pos button').forEach(b=>b.classList.toggle('on',b.dataset.k==='${k}'))">${n}</button>`).join('')}</div><label>Numero di maglia</label><input id="bp-num" type="number" inputmode="numeric" min="0" max="99" value="${esc(m.num||S.profile?.num||'')}"><div class="err" id="sheet-err"></div><div class="row" style="margin-top:12px"><button class="p" onclick="becomePlayerSave()">Conferma</button><button onclick="closeSheet()">Annulla</button></div>`)}
function becomePlayerSave(){const n=$('bp-num').value.trim();if(!n)return sheetErr('Indica il numero di maglia.');const m=S.members.find(x=>x.id===_bp.id),t=S.teams.find(x=>x.id===m.tid);
  S.db.doc('members/'+_bp.id).update({role:'giocatore',pos:_bp.pos,num:n,admin:!!(m.admin||(t&&t.owner===m.uid))});closeSheet()}

// Ricerca nella rosa (filtra senza ridisegnare, così la tastiera resta aperta).
const rosaQ=m=>((m.nick||'')+' '+(m.name||'')).toLowerCase();
function rosaSearch(v){S.rq=v;const q=v.trim().toLowerCase();document.querySelectorAll('[data-q]').forEach(e=>e.style.display=q&&!e.dataset.q.includes(q)?'none':'');let any=false;
  document.querySelectorAll('h2.rh').forEach(h=>{const n=h.nextElementSibling,on=!!n&&[...n.querySelectorAll('[data-q]')].some(e=>e.style.display!=='none');h.style.display=n.style.display=on?'':'none';any=any||on});
  const z=document.getElementById('rnone2');if(z)z.style.display=q&&!any?'':'none'}

// Andamento dell'overall del giocatore partita dopo partita (stessa formula di ovr()).
function ovrSeries(m){const w=W[m.pos]||[0,0],t={p:0,g:0,a:0,og:0,y:0,r:0,gs:0,ps:0},out=[];
  S.matches.filter(x=>x.tid===m.tid&&x.played&&inSeason(x)&&(x.present||[]).includes(m.id)).sort((a,b)=>a.date<b.date?-1:1).forEach(x=>{const s=(x.stats||{})[m.id]||{};t.p++;for(const k of['g','a','og','y','r','gs','ps'])t[k]+=+s[k]||0;
    let o=55+t.g*w[0]+t.a*w[1]+t.p*.6-t.og*3-t.y*.5-t.r*2;if(m.pos==='P')o+=t.p-t.gs*.7+t.ps*2;out.push({o:Math.max(40,Math.min(99,Math.round(o)))})});return out}
function ovrChart(m){const s=ovrSeries(m);if(s.length<2)return '';const w=300,h=84,p=10,lo=Math.min(...s.map(e=>e.o)),hi=Math.max(...s.map(e=>e.o)),rg=Math.max(4,hi-lo),X=i=>p+i*(w-2*p)/(s.length-1),Y=o=>h-p-(o-lo)/rg*(h-2*p);
  return `<h2>Andamento overall</h2><div class="card" style="padding:10px"><svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Overall dopo ogni partita, da ${s[0].o} a ${s[s.length-1].o}"><polyline points="${s.map((e,i)=>X(i).toFixed(1)+','+Y(e.o).toFixed(1)).join(' ')}" fill="none" stroke="var(--acf)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${s.map((e,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(e.o).toFixed(1)}" r="3.5" fill="var(--acf)"/>`).join('')}</svg><div class="row" style="justify-content:space-between;align-items:center"><span class="mu">${s[0].o}</span><span class="mu">${s.length} partite</span><b>${s[s.length-1].o}</b></div></div>`}

// Avviso "Sei offline".
(function(){const sync=()=>{let b=document.getElementById('offline');if(navigator.onLine){b&&b.remove();return}if(!b){b=document.createElement('div');b.id='offline';b.setAttribute('role','status');b.textContent='Sei offline: le modifiche non verranno salvate finché manca la rete.';document.body.append(b)}};
  addEventListener('offline',sync);addEventListener('online',()=>{sync();if(typeof toast==='function')toast('Di nuovo online',true)});sync()})();

// Invito ad aggiungere l'app alla schermata Home.
(function(){let ev=null,shown=false;const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone,ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e});
  window.a2hsLater=()=>{document.getElementById('a2hs')?.remove();try{localStorage.setItem('a2hs',Date.now()+30*864e5)}catch(e){}};
  window.a2hsGo=()=>{if(ev){ev.prompt();ev=null;a2hsLater()}else a2hsHow()};
  window.a2hsHow=()=>{const I=['Apri l’app con <b>Safari</b>.','Tocca <b>Condividi</b> (il quadrato con la freccia verso l’alto).','Scorri e tocca <b>Aggiungi alla schermata Home</b>.','Conferma con <b>Aggiungi</b>.'],A=['Apri l’app con <b>Chrome</b>.','Tocca i tre puntini <b>⋮</b> in alto a destra.','Tocca <b>Installa app</b> (o <b>Aggiungi a schermata Home</b>).','Conferma con <b>Installa</b>.'],blk=(t,l)=>`<h3>${t}</h3><ol class="stps">${l.map(s=>`<li>${s}</li>`).join('')}</ol>`;
    sheet(`<h2 style="margin-top:0">Aggiungi l’app alla Home</h2><p class="mu">Si apre a schermo intero, come un’app, e la ritrovi con un tocco.</p>${ios?blk('iPhone / iPad',I)+blk('Android',A):blk('Android',A)+blk('iPhone / iPad',I)}<div class="row" style="margin-top:12px"><button class="p" onclick="closeSheet();a2hsLater()">Ho capito</button></div>`)};
  setInterval(()=>{if(shown||standalone()||!document.querySelector('.bn'))return;let t=0;try{t=+localStorage.getItem('a2hs')||0}catch(e){}if(Date.now()<t)return;shown=true;
    const d=document.createElement('div');d.id='a2hs';d.className='a2hs';d.innerHTML='<span>Aggiungi l’app alla schermata Home</span><button class="s" onclick="a2hsGo()">'+(ev?'Installa':'Come si fa')+'</button><button class="s" onclick="a2hsLater()" aria-label="Chiudi">✕</button>';document.body.append(d)},4000)})();

// ===== Schermate vuote, scheletro, festa al gol =====
(function(){const st=document.createElement('style');st.textContent=`.empty{text-align:center;padding:28px 16px;border:1px dashed var(--bd);border-radius:18px;margin:8px 0}.eic{width:56px;height:56px;margin:0 auto 10px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--acf) 18%,var(--bg));color:var(--acf)}.eic .ic{width:28px;height:28px}.empty b{display:block;font-size:17px}.empty p{margin:6px 0 12px}
.sk-b{border-radius:16px;background:linear-gradient(90deg,var(--sf) 25%,color-mix(in srgb,var(--tx) 10%,var(--sf)) 50%,var(--sf) 75%);background-size:200% 100%;animation:skl 1.3s linear infinite}@keyframes skl{to{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.sk-b,.splash img{animation:none}}`;document.head.append(st)})();
const emptyState=(i,t,x,b)=>`<div class="empty"><div class="eic">${ic(i)}</div><b>${t}</b><p class="mu">${x}</p>${b||''}</div>`;
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=document.createElement('canvas'),w=c.width=innerWidth,h=c.height=innerHeight;c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:95';document.body.append(c);
  const g=c.getContext('2d'),acc=getComputedStyle(document.documentElement).getPropertyValue('--acf').trim()||'#f5c518',cols=[acc,'#ffd54a','#ffffff','#34d399','#60a5fa','#f87171'],t0=performance.now(),
  ps=Array.from({length:110},()=>({x:w/2,y:h*.38,vx:(Math.random()-.5)*14,vy:-Math.random()*13-3,s:6+Math.random()*7,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[Math.random()*cols.length|0]}));
  (function f(t){const k=t-t0;g.clearRect(0,0,w,h);ps.forEach(p=>{p.vy+=.45;p.vx*=.992;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;g.save();g.globalAlpha=Math.max(0,1-k/1800);g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.c;g.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);g.restore()});if(k<1800)requestAnimationFrame(f);else c.remove()})(t0)}

// ===== Storico contro un avversario =====
function h2hCard(tid,opp,exId,quiet){const k=String(opp||'').trim().toLowerCase();if(!k)return '';
  const l=S.matches.filter(x=>x.tid===tid&&x.played&&x.id!==exId&&String(x.opp||'').trim().toLowerCase()===k).sort((a,b)=>a.date<b.date?1:-1);
  if(!l.length)return quiet?'':`<div class="card"><b>Storico contro ${esc(opp)}</b><p class="mu" style="margin:6px 0 0">Prima volta contro questa squadra.</p></div>`;
  const r=teamRec(l);return `<div class="card"><b>Storico contro ${esc(opp)}</b><p class="mu" style="margin:6px 0 8px">${r.g} ${r.g===1?'partita':'partite'} · ${r.v}V ${r.n}N ${r.p}P · gol ${r.gf}-${r.ga}</p>${l.slice(0,5).map(x=>`<div class="lr"><span class="mu" style="width:78px">${esc(dt(x.date).f)}</span><span class="mu" style="flex:1">${esc(x.tourn||'Amichevoli')}</span><b>${esc(x.gf)}-${esc(x.ga)}</b><i class="rb ${x.gf>x.ga?'v':x.gf<x.ga?'p':'n'}" style="margin:0 0 0 8px">${x.gf>x.ga?'V':x.gf<x.ga?'P':'N'}</i></div>`).join('')}</div>`}
function h2hLive(v){const e=document.getElementById('h2h-live');if(e)e.innerHTML=h2hCard(S.tid,v,null,true)}

// ===== Calendario (.ics): una partita o tutte quelle in programma, con promemoria un'ora prima =====
function addToCalendar(id){const T=S.teams.find(t=>t.id===S.tid)||{},today=new Date().toISOString().slice(0,10),
  ms=id?[S.matches.find(m=>m.id===id)].filter(Boolean):S.matches.filter(m=>m.tid===S.tid&&!m.played&&m.date>=today).sort((a,b)=>a.date<b.date?-1:1);
  if(!ms.length){toast('Nessuna partita in programma da aggiungere.');return}
  const e=s=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n'),p2=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate()),stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  const ev=ms.map(x=>{const y=+x.date.slice(0,4),mo=+x.date.slice(5,7)-1,dd=+x.date.slice(8,10),md=matchDetail(x),tm=(md.time||'').match(/^(\d{2}):(\d{2})/);let s,en;
    if(tm){const end=new Date(y,mo,dd,+tm[1]+1,+tm[2]+30);s='DTSTART:'+ymd(new Date(y,mo,dd))+'T'+tm[1]+tm[2]+'00';en='DTEND:'+ymd(end)+'T'+p2(end.getHours())+p2(end.getMinutes())+'00'}
    else{s='DTSTART;VALUE=DATE:'+ymd(new Date(y,mo,dd));en='DTEND;VALUE=DATE:'+ymd(new Date(y,mo,dd+1))}
    return ['BEGIN:VEVENT','UID:'+x.id+'@squadra','DTSTAMP:'+stamp,s,en,'SUMMARY:'+e((T.name||'Squadra')+' vs '+x.opp),md.location?'LOCATION:'+e(md.location):'',x.tourn?'DESCRIPTION:'+e(x.tourn):'','BEGIN:VALARM','TRIGGER:-PT60M','ACTION:DISPLAY','DESCRIPTION:Partita tra un’ora','END:VALARM','END:VEVENT'].filter(Boolean).join('\r\n')}).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Squadra//IT\r\nCALSCALE:GREGORIAN\r\n'+ev+'\r\nEND:VCALENDAR\r\n'],{type:'text/calendar'}));a.download=id?'partita-'+ms[0].date+'.ics':'partite.ics';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}

// ===== Immagini da condividere: classifica, carta, riepilogo stagione =====
const seasonLabel=()=>{const a=activeSeason();return a==='all'?'TUTTE LE STAGIONI':String(a)};
async function shareImage(title,name,draw){
  sheet(`<h2 style="margin-top:0">${title}</h2><p class="mu" id="si-st">Generazione immagine…</p><div id="si-img"></div><div class="row" style="margin-top:12px"><button class="p" id="si-sh" disabled>Condividi immagine</button><button id="si-dl" disabled>Scarica PNG</button><button onclick="closeSheet()">Chiudi</button></div>`);
  try{
    if(document.fonts){await Promise.all([document.fonts.load('700 100px Oswald'),document.fonts.load('500 30px Oswald'),document.fonts.load('700 100px Caveat')]).catch(()=>{});await document.fonts.ready}
    const team=S.teams.find(t=>t.id===S.tid)||{},P={...formationDefaults(team,await reportPalette(team)),...(teamShareStyle(team,'result').palette||{})},logo=await reportLogo(team.logo),c=document.createElement('canvas');c.width=1080;c.height=1920;const ctx=c.getContext('2d');
    ctx.fillStyle=P.background;ctx.fillRect(0,0,1080,1920);const g=ctx.createRadialGradient(540,0,60,540,0,1100);g.addColorStop(0,P.accent);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=.35;ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);ctx.globalAlpha=1;
    await draw(ctx,P,team,logo);
    const blob=await new Promise((r,j)=>c.toBlob(b=>b?r(b):j(),'image/png'));if(!document.getElementById('si-img'))return;
    const url=URL.createObjectURL(blob),file=new File([blob],name+'.png',{type:'image/png'}),im=new Image();im.src=url;im.alt=title;im.style.cssText='display:block;height:min(55vh,600px);width:auto;max-width:100%;margin:0 auto;border-radius:12px';$('si-img').replaceChildren(im);
    const can=!!navigator.canShare?.({files:[file]}),dl=()=>{const a=document.createElement('a');a.href=url;a.download=name+'.png';a.click()};
    $('si-st').textContent=can?'Immagine pronta: scegli Instagram e poi Storia.':'Immagine pronta. Scarica il PNG e caricalo nella tua storia.';$('si-sh').textContent=can?'Condividi immagine':'Salva immagine';
    $('si-sh').onclick=async()=>{if(!can)return dl();try{await navigator.share({files:[file],title})}catch(e){if(e.name!=='AbortError')$('si-st').textContent='Condivisione non riuscita. Usa Scarica PNG.'}};$('si-dl').onclick=dl;$('si-sh').disabled=$('si-dl').disabled=false;
  }catch(e){const s=$('si-st');if(s)s.textContent='Impossibile generare l’immagine. Riprova.'}}
function statHead(ctx,P,team,logo,kicker,y0=130){const W=1080;if(logo){ctx.save();ctx.beginPath();ctx.arc(W/2,y0+60,60,0,Math.PI*2);ctx.clip();ctx.drawImage(logo,W/2-60,y0,120,120);ctx.restore()}
  let sz=80;const nm=(team.name||'').toUpperCase();ctx.textAlign='center';ctx.fillStyle=P.text;do{sz-=4;ctx.font=`700 ${sz}px Oswald, sans-serif`}while(ctx.measureText(nm).width>900&&sz>36);ctx.fillText(nm,W/2,y0+215);
  ctx.fillStyle=P.accent;ctx.font='700 34px Oswald, sans-serif';if('letterSpacing' in ctx)ctx.letterSpacing='8px';ctx.fillText(kicker,W/2+4,y0+275);if('letterSpacing' in ctx)ctx.letterSpacing='0px'}
function statTile(ctx,P,x,y,w,h,val,label){ctx.fillStyle='rgba(255,255,255,.08)';reportRoundRect(ctx,x,y,w,h,24);ctx.fill();ctx.textAlign='center';ctx.fillStyle=P.accent;ctx.font=`700 ${Math.round(h*.42)}px Oswald, sans-serif`;ctx.fillText(val,x+w/2,y+h*.6);ctx.fillStyle=P.text;ctx.globalAlpha=.75;ctx.font='500 28px Oswald, sans-serif';ctx.fillText(label,x+w/2,y+h*.88);ctx.globalAlpha=1}
async function drawAv(ctx,m,cx,cy,r,P){ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();const im=m.photo?await reportLogo(m.photo):null;
  if(im){const s=Math.max(2*r/im.width,2*r/im.height);ctx.drawImage(im,cx-im.width*s/2,cy-im.height*s/2,im.width*s,im.height*s)}else{ctx.fillStyle=P.accent;ctx.fillRect(cx-r,cy-r,2*r,2*r);ctx.fillStyle=fxContrast(P.accent);ctx.font=`700 ${r}px Oswald, sans-serif`;ctx.textAlign='center';ctx.fillText((m.nick||'?')[0].toUpperCase(),cx,cy+r*.35)}
  ctx.restore();ctx.strokeStyle=P.accent;ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke()}
function shareClass(){const t=S.teams.find(x=>x.id===S.tid)||{},cs=['ov','g','a','p'].includes(S.cs)?S.cs:'sq',lab={sq:'STAGIONE',ov:'OVERALL',g:'MARCATORI',a:'ASSIST',p:'PRESENZE'}[cs];
  shareImage('Classifica '+lab.toLowerCase(),'classifica-'+cs,async(ctx,P,team,logo)=>{
    statHead(ctx,P,team,logo,(cs==='sq'?'RIEPILOGO':'CLASSIFICA '+lab)+' · '+seasonLabel());
    if(cs==='sq'){const l=S.matches.filter(x=>x.tid===t.id&&x.played&&inSeason(x)).sort((a,b)=>a.date<b.date?-1:1),r=teamRec(l);
      [[r.g,'GIOCATE'],[r.v,'VITTORIE'],[r.n,'PAREGGI'],[r.p,'SCONFITTE'],[r.gf,'GOL FATTI'],[r.ga,'GOL SUBITI'],[(r.dr>0?'+':'')+r.dr,'DIFF. RETI'],[r.pt,'PUNTI']].forEach((e,i)=>statTile(ctx,P,90+(i%2)*460,620+Math.floor(i/2)*230,440,200,e[0],e[1]));
      ctx.textAlign='center';ctx.fillStyle=P.text;ctx.globalAlpha=.8;ctx.font='700 28px Oswald, sans-serif';ctx.fillText('FORMA',540,1585);ctx.globalAlpha=1;
      l.slice(-5).forEach((x,i,a)=>{const cx=540+(i-(a.length-1)/2)*170;ctx.fillStyle=x.gf>x.ga?'#34d399':x.gf===x.ga?'#fbbf24':'#f87171';reportRoundRect(ctx,cx-72,1615,144,110,22);ctx.fill();ctx.fillStyle='#0b1220';ctx.textAlign='center';ctx.font='700 46px Oswald, sans-serif';ctx.fillText(x.gf+'-'+x.ga,cx,1688)})}
    else{const ms=S.members.filter(m=>m.tid===t.id&&m.role==='giocatore').map(m=>({m,v:cs==='ov'?ovr(m):stats(m)[cs],s:stats(m)})).filter(a=>a.v>0).sort((a,b)=>b.v-a.v).slice(0,10);
      if(!ms.length){ctx.textAlign='center';ctx.fillStyle=P.text;ctx.font='500 40px Oswald, sans-serif';ctx.fillText('Ancora nessun dato',540,900)}
      for(let i=0;i<ms.length;i++){const y=660+i*108,a=ms[i];ctx.fillStyle=i<3?'rgba(255,255,255,.1)':'rgba(255,255,255,.05)';reportRoundRect(ctx,90,y-48,900,96,26);ctx.fill();ctx.textAlign='center';ctx.fillStyle=['#ffd54a','#dfe5ec','#cd7f32'][i]||P.text;ctx.font='700 46px Oswald, sans-serif';ctx.fillText(i+1,150,y+16);
        await drawAv(ctx,a.m,260,y,36,P);const nm=(a.m.nick||'').toUpperCase(),ov=cs==='ov';let fs=46;ctx.textAlign='left';ctx.fillStyle=P.text;do{ctx.font=`700 ${fs}px Oswald, sans-serif`;fs-=2}while(ctx.measureText(nm).width>(ov?540:480)&&fs>26);ctx.fillText(nm,320,ov?y:y+16);ctx.textAlign='right';ctx.fillStyle=P.accent;ctx.font='700 60px Oswald, sans-serif';ctx.fillText(a.v,955,ov?y+12:y+20);
        if(ov){ctx.fillStyle=P.text;ctx.globalAlpha=.7;ctx.font='500 20px Oswald, sans-serif';ctx.fillText('OVERALL',955,y+40);ctx.textAlign='left';ctx.font='500 28px Oswald, sans-serif';ctx.fillText('GOL '+a.s.g+'  ·  ASSIST '+a.s.a,320,y+36);ctx.globalAlpha=1}}}
    formationFooter(ctx,P.accent,1838,'Forza ragazzi')})}
function shareCard(id){const m=S.members.find(x=>x.id===id);if(!m)return;shareImage('Carta di '+m.nick,'carta-'+m.nick,async(ctx,P,team,logo)=>{
  const t=stats(m),o=ovr(m),tr=o>=88?['#fff3a8','#ffd54a','#c9962b']:o>=75?['#ffe69a','#ffd54a','#b8860b']:o>=65?['#f4f6f9','#d5dbe3','#9aa5b1']:['#e3a46b','#cd7f32','#8a5420'],ink='#1b1408',x=140,y=330,w=800,h=1160,g=ctx.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,tr[0]);g.addColorStop(.5,tr[1]);g.addColorStop(1,tr[2]);ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=50;ctx.shadowOffsetY=20;ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(x+70,y);ctx.lineTo(x+w-70,y);ctx.quadraticCurveTo(x+w,y,x+w,y+70);ctx.lineTo(x+w,y+h-150);ctx.quadraticCurveTo(x+w,y+h,x+w-150,y+h);ctx.lineTo(x+150,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-150);ctx.lineTo(x,y+70);ctx.quadraticCurveTo(x,y,x+70,y);ctx.closePath();ctx.fill();ctx.restore();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=6;ctx.stroke();
  ctx.textAlign='left';ctx.fillStyle=ink;ctx.font='700 170px Oswald, sans-serif';ctx.fillText(o,x+90,y+230);ctx.font='700 64px Oswald, sans-serif';ctx.fillText(m.pos||'',x+96,y+305);ctx.font='500 50px Oswald, sans-serif';ctx.fillText(m.num?'#'+m.num:'',x+96,y+370);
  if(logo){ctx.save();ctx.beginPath();ctx.arc(x+135,y+450,45,0,Math.PI*2);ctx.clip();ctx.drawImage(logo,x+90,y+405,90,90);ctx.restore()}
  await drawAv(ctx,m,x+510,y+340,200,{...P,accent:ink});ctx.textAlign='center';ctx.fillStyle=ink;ctx.font='700 100px Oswald, sans-serif';ctx.fillText(reportFit(ctx,(m.nick||'').toUpperCase(),680),x+w/2,y+700);
  ctx.fillRect(x+120,y+740,w-240,4);[[t.g,'GOL'],[t.a,'ASSIST'],[t.p,'PRES.']].forEach((e,i)=>{const cx=x+200+i*200;ctx.font='700 110px Oswald, sans-serif';ctx.fillText(e[0],cx,y+880);ctx.font='500 34px Oswald, sans-serif';ctx.fillText(e[1],cx,y+935)});
  ctx.font='500 32px Oswald, sans-serif';ctx.globalAlpha=.75;ctx.fillText(seasonLabel(),x+w/2,y+1030);ctx.globalAlpha=1;{const bl=badgeList(m).filter(b=>b.on).map(b=>b.short);if(bl.length){ctx.font='700 34px Oswald, sans-serif';ctx.fillText(reportFit(ctx,bl.join('  ·  '),680),x+w/2,y+1085)}}statHead(ctx,P,team,null,'',60);formationFooter(ctx,P.accent,1838,'Forza ragazzi')})}
function shareRecap(id){const m=S.members.find(x=>x.id===id);if(!m)return;shareImage('Riepilogo di '+m.nick,'stagione-'+m.nick,async(ctx,P,team,logo)=>{
  const t=stats(m),o=ovr(m),gm=S.matches.filter(x=>x.tid===m.tid&&x.played&&inSeason(x)&&(x.present||[]).includes(m.id)),mv=gm.filter(x=>{const b=mvp(x);return b&&b.m.id===m.id}).length,best=gm.map(x=>({x,r:rate((x.stats||{})[m.id]||{})})).sort((a,b)=>b.r-a.r)[0];
  statHead(ctx,P,team,logo,'LA MIA STAGIONE · '+seasonLabel(),90);await drawAv(ctx,m,540,620,150,P);ctx.textAlign='center';ctx.fillStyle=P.text;ctx.font='700 96px Oswald, sans-serif';ctx.fillText(reportFit(ctx,(m.nick||'').toUpperCase(),900),540,865);
  ctx.globalAlpha=.8;ctx.font='500 38px Oswald, sans-serif';ctx.fillText([POS[m.pos],m.num?'#'+m.num:''].filter(Boolean).join(' · ').toUpperCase(),540,925);ctx.globalAlpha=1;
  [[o,'OVERALL'],[t.p,'PRESENZE'],[t.g,'GOL'],[t.a,'ASSIST'],[t.p?(t.g/t.p).toFixed(2):'0.00','GOL/PART.'],[mv,'MVP'],[t.y,'GIALLI'],[t.r,'ROSSI'],m.pos==='P'?[t.gs,'SUBITI']:[t.og,'AUTOGOL']].forEach((e,i)=>statTile(ctx,P,90+(i%3)*310,980+Math.floor(i/3)*215,280,185,e[0],e[1]));
  if(best&&gm.length>1){ctx.fillStyle=P.text;ctx.globalAlpha=.85;ctx.font='500 34px Oswald, sans-serif';ctx.fillText(reportFit(ctx,'MIGLIOR PARTITA · vs '+String(best.x.opp).toUpperCase()+' '+best.x.gf+'-'+best.x.ga+' · VOTO '+best.r.toFixed(1),900),540,1700);ctx.globalAlpha=1}
  formationFooter(ctx,P.accent,1838,'Che stagione!')})}
const shareBtns=m=>`<div class="row" style="margin:12px 0"><button class="s" onclick="shareCard('${m.id}')">${ic('share')} Condividi carta</button><button class="s" onclick="shareRecap('${m.id}')">${ic('trophy')} Riepilogo stagione</button></div>`;


// ===== Traguardi e badge =====
const BADGES={ht:['Hat-trick','star','HAT-TRICK'],g10:['10 gol','ball','10 GOL'],p20:['20 presenze','shield','20 PRES.'],cap:['Capocannoniere','trophy','CAPOCANNONIERE'],pp:['Rigore parato','glove','PARARIGORI']};
(function(){const st=document.createElement('style');st.textContent='.bds{display:flex;justify-content:center;gap:5px;margin-top:8px}.bds span{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.25)}.bds .ic{width:13px;height:13px}.bgl{display:grid;gap:10px}.bgi{display:flex;gap:10px;align-items:center;opacity:.5}.bgi.on{opacity:1}.bgi b{display:block}.bgc{width:34px;height:34px;flex:none;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--acf) 22%,var(--bg));color:var(--acf)}.bgi.on .bgc{background:var(--acf);color:var(--on)}.bgc .ic{width:18px;height:18px}';document.head.append(st)})();
// Conta solo partite giocate o in corso (con eventi in diretta); le presenze solo quelle giocate.
function badgeCalc(tid,over){const ms=S.matches.filter(x=>x.tid===tid).map(x=>over&&x.id===over.id?over:lvEff(x)),out={};let top=0;
  S.members.filter(m=>m.tid===tid&&m.role==='giocatore').forEach(m=>{let g=0,p=0,ht=0,ps=0,sg=0;
    ms.forEach(x=>{if(!x.played&&!(x.events||[]).length)return;const s=(x.stats||{})[m.id]||{},n=+s.g||0;g+=n;ps+=+s.ps||0;if(n>=3)ht++;if(x.played&&(x.present||[]).includes(m.id))p++;if(inSeason(x))sg+=n});
    out[m.id]={ht,g,p,ps,sg,pos:m.pos};top=Math.max(top,sg)});
  for(const id in out)out[id].cap=out[id].sg>=3&&out[id].sg===top;return out}
function badgeKeys(tid,over){const c=badgeCalc(tid,over),o={};for(const id in c){const b=c[id];o[id]=[b.cap&&'cap',b.ht>0&&'ht'+b.ht,b.g>=10&&'g10',b.p>=20&&'p20',b.pos==='P'&&b.ps>0&&'pp'].filter(Boolean)}return o}
function badgeCheer(before,after){const out=[];for(const id in after)after[id].forEach(k=>{if(!(before[id]||[]).includes(k))out.push([id,k])});if(!out.length)return false;
  const nm=id=>(S.members.find(m=>m.id===id)||{}).nick||'';toast(out.slice(0,2).map(([id,k])=>nm(id)+': '+BADGES[k.slice(0,2)==='ht'?'ht':k][0]).join(' · ')+(out.length>2?' …':''),true);setTimeout(()=>{try{confetti()}catch(e){}},350);return true}
function badgeList(m){const b=badgeCalc(m.tid)[m.id]||{ht:0,g:0,p:0,ps:0,sg:0},l=[
  {k:'ht',on:b.ht>0,note:b.ht>1?'Ottenuto '+b.ht+' volte':b.ht?'Ottenuto':'3 gol in una partita'},
  {k:'g10',on:b.g>=10,note:b.g>=10?b.g+' gol in carriera':Math.min(b.g,10)+'/10 gol'},
  {k:'p20',on:b.p>=20,note:b.p>=20?b.p+' presenze':b.p+'/20 presenze'},
  {k:'cap',on:!!b.cap,note:b.cap?b.sg+' gol in '+seasonLabel().toLowerCase():'Miglior marcatore (da 3 gol)'}];
  if(m.pos==='P')l.push({k:'pp',on:b.ps>0,note:b.ps?b.ps+(b.ps>1?' rigori parati':' rigore parato'):'Para un rigore'});
  return l.map(e=>({...e,label:BADGES[e.k][0],icon:BADGES[e.k][1],short:BADGES[e.k][2]}))}
function badgeIcons(m){const l=badgeList(m).filter(b=>b.on);return l.length?'<div class="bds">'+l.map(b=>'<span title="'+b.label+'">'+ic(b.icon)+'</span>').join('')+'</div>':''}
function badgePanel(m){return '<h2>Traguardi</h2><div class="card"><div class="bgl">'+badgeList(m).map(b=>'<div class="bgi'+(b.on?' on':'')+'"><span class="bgc">'+ic(b.icon)+'</span><div><b>'+b.label+'</b><span class="mu">'+b.note+'</span></div></div>').join('')+'</div></div>'}

// ===== Apri in Maps =====
function openMaps(id){const x=S.matches.find(m=>m.id===id),q=v('el')||(x&&matchDetail(x).location)||'';if(!q){toast('Scrivi prima il luogo della partita.');return}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  window.open((ios?'https://maps.apple.com/?q=':'https://www.google.com/maps/search/?api=1&query=')+encodeURIComponent(q),'_blank','noopener')}

// ===== Transizioni: le schede scorrono di lato =====
(function(){const st=document.createElement('style');st.textContent='.fx-l{animation:fxl .26s cubic-bezier(.2,.85,.25,1)}.fx-r{animation:fxr .26s cubic-bezier(.2,.85,.25,1)}@keyframes fxl{from{transform:translateX(-36px);opacity:.3}}@keyframes fxr{from{transform:translateX(36px);opacity:.3}}@media (prefers-reduced-motion:reduce){.fx-l,.fx-r{animation:none}}';document.head.append(st)})();
const FX_TABS=['cal','rosa','cls','imp'];
function fxBefore(){return {tab:S.tab,mid:S.mid}}
function fxSlide(els,d){els.forEach(e=>{if(!e)return;e.classList.remove('fx-l','fx-r');void e.offsetWidth;e.classList.add(d>0?'fx-r':'fx-l')})}
function fxAfter(f){if(!f)return;let d=0;if(f.tab!==S.tab)d=FX_TABS.indexOf(S.tab)-FX_TABS.indexOf(f.tab);else if(f.mid!==S.mid)d=S.mid?1:-1;if(d)fxSlide([document.querySelector('#app .view .pg')],d)}
