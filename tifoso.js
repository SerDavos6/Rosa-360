// Modalità tifoso: si entra senza account, si cerca una squadra o un torneo e si seguono partite,
// risultati, dirette, rosa e classifiche in sola lettura. I preferiti restano sul dispositivo.
// I dati arrivano da tre funzioni Supabase (vedi tifoso.sql) che espongono solo informazioni pubbliche.
(function(){
const F={q:"",res:null,loading:false,tour:null,busy:false,sig:{},tick:0,wrapped:false,ts:null};
const ID=s=>/^[\w.:@+~-]{1,120}$/.test(String(s));
const XI='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const focusQ=()=>setTimeout(()=>{const e=document.getElementById("fq");if(e)e.focus()},80);
const SRCH='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const favs=()=>{try{const a=JSON.parse(localStorage.getItem("favs")||"[]");return Array.isArray(a)?a.filter(f=>f&&ID(f.id)):[]}catch(e){return[]}};
const saveLocal=a=>{try{localStorage.setItem("favs",JSON.stringify(a))}catch(e){}};
// con un profilo tifoso le squadre preferite si salvano anche sull'account, così le ritrovi su ogni telefono
const saveFavs=a=>{saveLocal(a);if(F.dbo&&F.uid)F.dbo.doc("profiles/"+F.uid).update({favs:a}).catch(()=>toast("Preferiti non salvati sull’account. Riprova."))};
window.fanFavsRaw=()=>favs();
const isFav=id=>favs().some(f=>f.id===id);
const rpc=async(n,a)=>{const r=await sb.rpc(n,a);if(r.error)throw r.error;return r.data};
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");

const st=document.createElement("style");
st.textContent=`.favon{color:var(--ac)}.favon svg{fill:currentColor}
.lvb{display:inline-block;padding:2px 8px;border-radius:999px;background:#ef4444;color:#fff;font:800 11px var(--ui);letter-spacing:.05em}
.ftb{width:100%;border-collapse:collapse;font-size:14px}.ftb th,.ftb td{padding:9px 3px;text-align:center}
.ftb th{color:var(--mu);font-size:12px;font-weight:700}.ftb .l{text-align:left}.ftb tbody tr+tr td{border-top:1px solid var(--bd)}
.ftb .crest{width:28px;height:28px;min-width:28px;flex:none;border-radius:8px;font-size:14px}.ftb .crest .ic{width:16px;height:16px}.ftb{table-layout:fixed;min-width:0}.ftb td,.ftb th{border-bottom:0}.ftb .n{width:29px}.ftb .k{width:20px}.ftb .pt{width:34px}.ftb th,.ftb td{padding:9px 2px}.ftb td:first-child{padding-left:2px}
.ftb tbody tr{cursor:pointer}.ftb .t{display:flex;align-items:center;gap:8px;min-width:0}.ftb .t b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.frs{display:flex;align-items:center;gap:10px;padding:10px 2px;cursor:pointer}.frs+.frs{border-top:1px solid var(--bd)}.frs .sc{font-weight:800;min-width:48px;text-align:center}.frs .mid{flex:1;min-width:0}
.sbx{position:relative}.sbx>.ic{position:absolute;left:13px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:var(--mu);pointer-events:none}.sbx input{padding-left:40px;margin:0}.shint{margin:8px 2px 0;white-space:normal}`;
document.head.appendChild(st);

// ---- dati ----
async function load(id){
  const d=await rpc("fan_team",{tid:id});
  if(!d||!d.team)throw new Error("nf");
  const sig=JSON.stringify(d);if(F.sig[id]===sig)return false;
  F.sig[id]=sig;
  S.teams=S.teams.filter(x=>x.id!==id).concat([d.team]);
  S.members=S.members.filter(x=>x.tid!==id).concat(d.members||[]);
  S.matches=S.matches.filter(x=>x.tid!==id).concat(d.matches||[]);
  return true}
async function refreshFavs(){let ch=false;await Promise.all(favs().map(f=>load(f.id).then(c=>{ch=ch||c}).catch(()=>{})));return ch}
async function poll(){
  if(!S.fan||document.hidden)return;F.tick++;
  try{if(S.tid){if(await load(S.tid))render()}
    else if(!F.tour&&F.tick%4===0&&favs().length&&F.q.trim().length<2){if(await refreshFavs())render()}}catch(e){}}

// ---- ingresso / uscita ----
function core(){
  F.sig={};F.tour=null;F.res=null;F.q="";
  S.teams=[];S.members=[];S.matches=[];S.reqs=[];S.tid=null;S.tab="cal";S.mid=null;S.pd=null;S.flt="";S.mf="";S.cs="sq";
  const no=()=>Promise.resolve();   // in sola lettura nessuna scrittura può partire
  S.db={doc:()=>({set:no,update:no,delete:no,onSnapshot:()=>()=>{}}),collection:()=>({onSnapshot:()=>()=>{}})};
  if(!F.wrapped){F.wrapped=true;const r0=render;render=function(){return S.fan?fanRender():r0.apply(this,arguments)}}
  if(typeof lvSync==="function")try{lvSync()}catch(e){}
  if(!F.timer)F.timer=setInterval(poll,15000)}
window.fanStart=async function(pf,uid){
  try{localStorage.setItem("fan","1")}catch(e){}
  F.uid=uid||null;F.dbo=null;F.pf=pf||null;S.fan=1;S.browse=0;S.uid=uid||"tifoso";S.profile={fan:1,nick:"Tifoso"};
  if(uid){try{F.dbo=await claude.use("db")}catch(e){}
    if(pf&&Array.isArray(pf.favs))saveLocal(pf.favs.filter(f=>f&&ID(f.id)));else saveFavs(favs())}
  core();render();refreshFavs().then(c=>{if(c&&!S.tid)render()})};
// Dal profilo giocatore/dirigente: cerca altre squadre e tornei senza uscire dal proprio profilo.
window.fanBrowse=async function(){
  if(S.fan)return;
  S.stash={teams:S.teams,members:S.members,matches:S.matches,reqs:S.reqs,tid:S.tid,tab:S.tab,mid:S.mid,pd:S.pd,flt:S.flt,mf:S.mf,db:S.db,cs:S.cs,rq:S.rq,rf:S.rf,season:S.season};
  S.fan=1;S.browse=1;F.uid=S.uid;F.pf=S.profile;F.dbo=null;
  try{F.dbo=await claude.use("db")}catch(e){}
  if(S.profile&&Array.isArray(S.profile.favs))saveLocal(S.profile.favs.filter(f=>f&&ID(f.id)));
  core();render();focusQ();refreshFavs().then(c=>{if(c&&!S.tid)render()})};
window.fanLeave=function(){
  const k=S.stash;if(!k)return;Object.assign(S,k);S.stash=null;S.fan=0;S.browse=0;
  F.tour=null;F.uid=null;F.dbo=null;F.sig={};render()};
window.fanExit=function(){try{localStorage.removeItem("fan")}catch(e){}location.reload()};
window.fanSignOut=function(){try{localStorage.removeItem("fan")}catch(e){}sb.auth.signOut().then(()=>location.reload())};
window.fanToPlayer=async function(){
  const has=F.pf&&F.pf.role;
  if(!confirm(has?"Tornare al tuo profilo da giocatore o dirigente? Le tue squadre ti aspettano come prima.":"Creare un profilo da giocatore o dirigente? Ti chiederemo i tuoi dati. Le squadre preferite restano salvate."))return;
  try{await F.dbo.doc("profiles/"+F.uid).update({fan:false})}catch(e){toast("Operazione non riuscita. Riprova.");return}
  try{localStorage.removeItem("fan")}catch(e){}location.reload()};

// ---- navigazione ----
window.fanOpen=async function(id,mid){
  if(!ID(id))return;F.busy=true;render();
  try{await load(id)}catch(e){F.busy=false;render();
    if(!S.teams.some(t=>t.id===id)){toast("Squadra non disponibile. Controlla la connessione.");return}}
  F.busy=false;
  const ss=[...new Set(S.matches.filter(x=>x.tid===id&&x.date).map(x=>seasonOf(x.date)))].sort().reverse(),a=activeSeason();
  if(ss.length&&a!=="all"&&!ss.includes(a))S.season=ss[0];
  S.tid=id;S.tab="cal";S.mid=mid&&S.matches.some(x=>x.id===mid)?mid:null;S.pd=null;S.rq="";S.rf="";S.cs="sq";S.flt="";S.mf="";
  render()};
window.fanBack=function(){S.tid=null;S.mid=null;S.pd=null;render()};
window.fanHome=function(){S.tid=null;S.mid=null;S.pd=null;F.tour=null;render();focusQ()};
window.fanTour=async function(i){
  const t=F.res&&F.res.tours[i];if(!t)return;F.busy=true;render();
  try{const d=await rpc("fan_tournament",{n:t.name});F.tour={name:t.name,teams:d.teams||[],matches:d.matches||[]};F.ts=null}
  catch(e){toast("Torneo non disponibile. Controlla la connessione.")}
  F.busy=false;render()};
window.fanTs=function(s){F.ts=s;render()};
window.fanFav=function(id){
  let a=favs();
  if(a.some(f=>f.id===id)){a=a.filter(f=>f.id!==id);toast("Tolta dai preferiti",true)}
  else{const t=S.teams.find(x=>x.id===id)||(F.res&&F.res.teams.find(x=>x.id===id))||(F.tour&&F.tour.teams.find(x=>x.id===id))||{};
    a.push({id,name:t.name||"Squadra",logo:/^https:\/\//.test(t.logo||"")?t.logo:""});toast("Aggiunta ai preferiti",true);load(id).catch(()=>{})}
  saveFavs(a);if(S.tid||F.tour)render();else upd()};
let tm=0,seq=0;
window.fanSearch=function(v){
  F.q=v;clearTimeout(tm);const q=v.trim();
  if(q.length<2){seq++;F.res=null;F.loading=false;upd();return}
  F.loading=true;upd();const my=++seq;
  tm=setTimeout(async()=>{
    let r;try{r=await rpc("fan_search",{q})}catch(e){r={teams:[],tours:[],err:e&&e.code||"x"}}
    if(my!==seq)return;F.res=r;F.loading=false;upd()},300)};
const upd=()=>{const e=document.getElementById("fres");if(e)e.innerHTML=bodyHtml()};

// ---- viste ----
function info(id){
  const ms=S.matches.filter(x=>x.tid===id);if(!ms.length)return"";
  const n=new Date(),today=ymd(n),yest=ymd(new Date(n.getTime()-864e5));
  const live=ms.find(x=>!x.played&&(x.date===today||x.date===yest)&&((x.clock&&x.clock.since)||(x.events||[]).length));
  if(live)return `<div><span class="lvb">IN DIRETTA</span> <b>${esc(live.gf)}–${esc(live.ga)}</b> vs ${esc(live.opp)}</div>`;
  const nx=upNext(id);if(nx)return `<div class="gold">Prossima: vs ${esc(nx.opp)} · ${esc(dt(nx.date).f)}</div>`;
  const l=ms.filter(x=>x.played).sort((a,b)=>a.date<b.date?1:-1)[0];
  return l?`<div class="mu">Ultima: ${esc(l.gf)}–${esc(l.ga)} vs ${esc(l.opp)}</div>`:""}
function tcard(t,withInfo){
  const star=`<button class="ib${isFav(t.id)?" favon":""}" onclick="event.stopPropagation();fanFav(this.closest('.tcard').dataset.fid)" aria-label="Preferiti">${ic("star")}</button>`;
  return `<div class="card tcard" data-fid="${esc(t.id)}" onclick="fanOpen(this.dataset.fid)">${crest(t.logo,ic("ball"))}<div class="mid"><b class="hd" style="font-size:20px">${esc(t.name)}</b>${withInfo?info(t.id):""}</div>${star}</div>`}
function bodyHtml(){
  const q=F.q.trim();
  if(q.length===1)return `<p class="mu shint">Scrivi almeno 2 lettere per cercare.</p>`;
  if(q.length<2){
    const fv=favs().map(f=>S.teams.find(t=>t.id===f.id)||f);
    return fv.length?`<h2>Le tue squadre preferite</h2>${fv.map(t=>tcard(t,true)).join("")}`
      :`<div class="card mu" style="white-space:normal">Nessuna squadra preferita per ora. Cerca una squadra qui sopra e tocca la stella ${ic("star")} per ritrovarla qui, con la prossima partita e la diretta.</div>`}
  if(F.loading&&!F.res)return `<p class="mu">Cerco…</p>`;
  const r=F.res||{teams:[],tours:[]};
  if(r.err)return `<div class="card" style="white-space:normal">${r.err==="PGRST202"?"La modalità tifoso non è ancora attiva: va eseguito lo script <b>tifoso.sql</b> su Supabase.":"Ricerca non riuscita. Controlla la connessione e riprova."}</div>`;
  if(!r.teams.length&&!r.tours.length)return emptyState("trophy","Nessun risultato","Prova con un altro nome di squadra o di torneo.","");
  return (r.teams.length?`<h2>Squadre</h2>${r.teams.map(t=>tcard(t,false)).join("")}`:"")
    +(r.tours.length?`<h2>Tornei</h2>${r.tours.map((t,i)=>`<div class="card tcard" onclick="fanTour(${i})"><div class="crest">${ic("trophy")}</div><div class="mid"><b class="hd" style="font-size:20px">${esc(t.name)}</b><div class="mu">${t.n} squadr${t.n===1?"a":"e"}</div></div>${ic("chev")}</div>`).join("")}`:"")}
function homeHtml(){
  const top=S.browse?`<button class="s" onclick="fanLeave()">${XI} Chiudi</button>`:F.uid?"":'<button class="s" onclick="fanExit()">Accedi</button>';
  return `<div class="row"><h1 style="flex:1">${ic(S.browse?"search":"ball")} ${S.browse?"Cerca":"Tifoso"}</h1>${top}</div>
  <div class="sbx">${SRCH}<input id="fq" type="search" enterkeyhint="search" placeholder="Nome di una squadra o di un torneo" aria-label="Cerca squadre e tornei" autocomplete="off" value="${esc(F.q)}" oninput="fanSearch(this.value)"></div>
  <p class="mu shint">Trova una squadra o un torneo per seguire partite, risultati, dirette e classifiche.</p>
  ${F.busy?'<p class="mu">Carico…</p>':""}<div id="fres" style="margin-top:10px">${bodyHtml()}</div>${S.browse?"":settingsHtml()}`}
function settingsHtml(){
  const seg=`<div class="seg">${[["team","Squadra"],["auto","Auto"],["light","Chiaro"],["dark","Scuro"]].map(([k,n])=>`<button class="${getMode()===k?"on":""}" onclick="setMode('${k}')">${n}</button>`).join("")}</div>`;
  const acc=F.uid?`<div class="card"><b>Account</b><p class="mu" style="white-space:normal">Profilo tifoso: le squadre preferite sono salvate sul tuo account e le ritrovi su ogni telefono.${F.pf&&F.pf.role?" Il tuo profilo da giocatore o dirigente resta salvato.":""}</p><div class="pbtns"><button onclick="fanSignOut()">Esci dall’account</button><button onclick="fanToPlayer()">Passa a giocatore o dirigente</button></div></div>`
    :`<div class="card"><b>Account</b><p class="mu" style="white-space:normal">Crea un profilo tifoso per ritrovare le squadre preferite su ogni telefono. Se hai già un profilo, accedi.</p><button class="p" onclick="fanExit()">Accedi o crea un profilo</button></div>`;
  return `<div style="margin-top:22px"><div class="card"><b>Aspetto</b>${seg}<p class="mu" style="margin-bottom:0;white-space:normal">Vale solo su questo telefono. “Squadra” usa i colori della squadra che stai guardando.</p></div>${acc}</div>`}
function tourHtml(){
  const T=F.tour,seasons=[...new Set(T.matches.filter(m=>m.date).map(m=>seasonOf(m.date)))].sort().reverse(),se=seasons.includes(F.ts)?F.ts:seasons[0];
  const ms=T.matches.filter(m=>!se||(m.date&&seasonOf(m.date)===se)),by={};
  T.teams.forEach(t=>by[t.id]={t,g:0,v:0,n:0,p:0,gf:0,gs:0});
  ms.filter(m=>m.played&&by[m.tid]).forEach(m=>{const r=by[m.tid],a=+m.gf||0,b=+m.ga||0;r.g++;r.gf+=a;r.gs+=b;if(a>b)r.v++;else if(a<b)r.p++;else r.n++});
  const rows=Object.values(by).filter(r=>ms.some(m=>m.tid===r.t.id)).map(r=>({...r,pt:r.v*3+r.n,dr:r.gf-r.gs}))
    .sort((a,b)=>b.pt-a.pt||b.dr-a.dr||b.gf-a.gf||String(a.t.name).localeCompare(String(b.t.name)));
  const nm=id=>(by[id]&&by[id].t.name)||"Squadra";
  const line=m=>`<div class="frs" data-t="${esc(m.tid)}" data-m="${esc(m.id)}" onclick="fanOpen(this.dataset.t,this.dataset.m)"><div class="mid"><b>${esc(nm(m.tid))}</b><div class="mu">vs ${esc(m.opp)} · ${esc(dt(m.date).f)}</div></div>${m.played?`<span class="sc">${esc(m.gf)}–${esc(m.ga)}</span>`:""}${ic("chev")}</div>`;
  const done=ms.filter(m=>m.played).sort((a,b)=>a.date<b.date?1:-1).slice(0,15),todo=ms.filter(m=>!m.played).sort((a,b)=>a.date<b.date?-1:1).slice(0,10);
  return `<div class="row" style="flex-wrap:nowrap"><button class="ib" style="border:0" onclick="fanHome()" aria-label="Indietro">${ic("back")}</button><h1 style="flex:1;margin:0">${esc(T.name)}</h1></div>
  ${seasons.length>1?`<div class="csl" style="margin-top:8px">${seasons.map(s=>`<button class="chip${s===se?" on":""}" data-s="${esc(s)}" onclick="fanTs(this.dataset.s)">${esc(s)}</button>`).join("")}</div>`:""}
  <h2>Classifica</h2><div class="card" style="padding:6px 10px;overflow-x:auto"><table class="ftb"><thead><tr><th class="k">#</th><th class="l">Squadra</th><th class="n">G</th><th class="n">V</th><th class="n">N</th><th class="n">P</th><th class="n">DR</th><th class="pt">Pt</th></tr></thead><tbody>
  ${rows.map((r,i)=>`<tr data-t="${esc(r.t.id)}" onclick="fanOpen(this.dataset.t)"><td>${i+1}</td><td class="l"><div class="t">${crest(r.t.logo,ic("ball"),"sm")}<b>${esc(r.t.name)}</b></div></td><td>${r.g}</td><td>${r.v}</td><td>${r.n}</td><td>${r.p}</td><td>${r.dr>0?"+":""}${r.dr}</td><td><b class="gold">${r.pt}</b></td></tr>`).join("")||'<tr><td colspan="8" class="mu">Nessuna partita</td></tr>'}</tbody></table></div>
  <p class="mu" style="white-space:normal">La classifica considera solo le squadre iscritte all’app: gli avversari non iscritti non compaiono.</p>
  ${todo.length?`<h2>Prossime partite</h2><div class="card" style="padding:4px 12px">${todo.map(line).join("")}</div>`:""}
  ${done.length?`<h2>Ultimi risultati</h2><div class="card" style="padding:4px 12px">${done.map(line).join("")}</div>`:""}`}
function teamBar(t){
  return `<header class="bar"><button class="ib" style="border:0" onclick="${F.tour?"fanBack()":"fanHome()"}" aria-label="Indietro">${ic("back")}</button>${crest(t.logo,ic("ball"),"sm")}<div class="tn">${esc(t.name)}</div>${seasonSelect(t.id)}<button class="ib" onclick="toggleMode()" aria-label="Tema chiaro o scuro">${ic(isDarkNow()?"sun":"moon")}</button><button class="ib${isFav(t.id)?" favon":""}" onclick="fanFav('${t.id}')" aria-label="Preferiti">${ic("star")}</button></header>`}
function teamHtml(t){
  const nav=[["cal",ic("ball"),"Partite"],["rosa",ic("users"),"Rosa"],["cls",ic("trophy"),"Classifiche"]];
  const mx=S.tab==="cal"&&S.mid?S.matches.find(x=>x.id===S.mid):null;if(S.tab==="cal"&&S.mid&&!mx)S.mid=null;
  let head,body,foot="";
  if(mx){const p=matchParts(mx,false);head=p.head;body=p.body;foot=p.foot}
  else{head=teamBar(t);body=({rosa:rosaView,cal:calView,cls:clsView}[S.tab]||calView)(t,false)}
  return `${head}<div class="view"><div class="pg">${body}</div></div>${foot}${S.pd?playerModal(S.pd):""}<nav class="bn">${nav.map(([k,i,n])=>`<button class="${S.tab===k?"on":""}" onclick="S.tab='${k}';S.mid=null;S.pd=null;render()"><span>${i}</span>${n}</button>`).join("")}<button onclick="fanHome()"><span>${SRCH}</span>Cerca</button>${S.browse?`<button onclick="fanLeave()"><span>${XI}</span>Chiudi</button>`:""}</nav>`}

window.fanRender=function(){
  const a=$("app"),old=a.querySelector(".view"),oldTop=old?old.scrollTop:0,fx=fxBefore();
  const t=S.tid&&S.teams.find(x=>x.id===S.tid);
  applyTheme(t?t.color:null,t?t.bg:null);applyMode();syncBar();
  let html,key;
  if(t){html=teamHtml(t);key=["f",S.tid,S.tab,S.mid||"",S.cs||"",S.ps||""].join("|")}
  else if(F.tour){html=plain(tourHtml());key="ft|"+F.tour.name+"|"+(F.ts||"")}
  else{html=plain(homeHtml());key="fh"}
  morphInto(a,html);keepScroll(key,oldTop);if(t)fxAfter(fx);
  if(S.err){toast(S.err);S.err=""}};
})();
