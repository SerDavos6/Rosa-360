const matchDetail=x=>({location:x.location||'',time:x.time||'',field:x.field||''});
// Luogo + numero del campo (facoltativo) per le righe di testo
const matchPlace=x=>[x.location,x.field?'Campo '+x.field:''].filter(Boolean).join(' · ');
function reportLines(x){
  const team=S.teams.find(t=>t.id===x.tid)||{};
  const present=(x.present||[]).map(id=>S.members.find(m=>m.id===id)).filter(Boolean);
  const lines=[['TORNEO',x.tourn||'Amichevole'],['DATA',dt(x.date).f],['ORA',x.time||'Non indicata'],['LUOGO',matchPlace(x)||'Non indicato'],['STATO',x.played?'Partita terminata':'Da giocare']];
  const sc=scorers(x);lines.push(['MARCATORI',sc||(x.played?'Nessun marcatore registrato':'Da giocare')]);
  lines.push(['PRESENTI',present.map(m=>m.nick+(m.role==='dirigente'?' (dirigente)':'')).join(', ')||'Nessuna presenza registrata']);
  for(const m of present){
    const s=(x.stats||{})[m.id];if(!s||m.role!=='giocatore')continue;
    const values=[['g','gol'],['a','assist'],['og','autogol'],['y','ammonizioni'],['r','espulsioni'],...(m.pos==='P'?[['gs','gol subiti'],['ps','rigori parati']]:[])];
    lines.push([m.nick,values.map(([k,label])=>(s[k]||0)+' '+label).join(' · ')]);
  }
  return {team,lines};
}
function wrapReport(ctx,text,width){
  const lines=[];let line='';
  for(const word of String(text).split(/\s+/)){
    if(ctx.measureText((line?line+' ':'')+word).width<=width){line+=(line?' ':'')+word;continue}
    if(line){lines.push(line);line=''}
    for(const ch of word){if(ctx.measureText(line+ch).width>width&&line){lines.push(line);line=''}line+=ch}
  }
  if(line)lines.push(line);return lines.length?lines:[''];
}
async function reportLogo(src){
  if(!src)return null;
  return new Promise(resolve=>{const img=new Image();const timeout=setTimeout(()=>resolve(null),6000);img.crossOrigin='anonymous';img.onload=()=>{clearTimeout(timeout);resolve(img)};img.onerror=()=>{clearTimeout(timeout);resolve(null)};img.src=src});
}
function reportScorers(x){
  return Object.entries(x.stats||{}).filter(([,s])=>s.g>0).map(([id,s])=>({m:S.members.find(m=>m.id===id&&m.tid===x.tid&&m.role==='giocatore'),g:s.g})).filter(s=>s.m).sort((a,b)=>b.g-a.g).map(s=>s.m.nick+(s.g>1?' ×'+s.g:''));
}
async function reportPalette(team){
  let accent=team.color||'#f5c518';
  const logo=await reportLogo(team.logo);
  if(logo)try{accent=dominant(logo)||accent}catch{}
  return {accent:/^#[0-9a-f]{6}$/i.test(accent)?accent:'#f5c518',background:'#101216',text:'#f5f4ed'};
}
function reportPlayerStats(x){
  const present=(x.present||[]).map(id=>S.members.find(m=>m.id===id)).filter(Boolean);
  const players=present.filter(m=>m.role==='giocatore').map(m=>{
    const s=(x.stats||{})[m.id]||{};
    const parts=[['g','G'],['a','A'],['og','AG'],['y','AMM'],['r','ESP'],...(m.pos==='P'?[['gs','GS'],['ps','RP']]:[])].filter(([k])=>(s[k]||0)>0).map(([k,l])=>s[k]+' '+l);
    return {nick:m.nick,stats:parts.join(' · ')||'—'};
  });
  const staff=present.filter(m=>m.role==='dirigente').map(m=>m.nick);
  return {players,staff};
}
function reportRoundRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function reportFit(ctx,text,width){
  if(ctx.measureText(text).width<=width)return text;
  let t=text;while(t.length>1&&ctx.measureText(t+'…').width>width)t=t.slice(0,-1);
  return t+'…';
}
// Instagram Stories format: 1080×1920 (9:16). Content stays between ~220px and ~1700px,
// clear of the areas Instagram covers with the profile header and the reply bar.
async function matchReportBlob(x,options={}){
  if(document.fonts){await Promise.all([ensureCaveat(),document.fonts.load('700 124px Oswald')]).catch(()=>{});await document.fonts.ready;}
  const {team}=reportLines(x),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const palette=options.palette||await reportPalette(team);
  const {accent,background,text}=palette;
  const W=1080,H=1920;canvas.width=W;canvas.height=H;
  const font=(size,bold=false)=>`${bold?'700':'500'} ${size}px Oswald, sans-serif`;
  const played=!!x.played,gf=+x.gf||0,ga=+x.ga||0;
  const outcome=played?(gf>ga?{label:'VITTORIA',color:'#2fbf71'}:gf<ga?{label:'SCONFITTA',color:'#e5484d'}:{label:'PAREGGIO',color:'#f5c518'}):null;
  const logos=await Promise.all([reportLogo(team.logo),reportLogo(x.oppLogo)]);

  const style=options.style||'poster';
  ctx.fillStyle=background;ctx.fillRect(0,0,W,H);
  let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  if(style==='gradient'){
    const g=ctx.createRadialGradient(W/2,820,80,W/2,820,1250);g.addColorStop(0,accent);g.addColorStop(.55,background);g.addColorStop(1,background);
    ctx.globalAlpha=.4;ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
    const v=ctx.createLinearGradient(0,0,0,H);v.addColorStop(0,'rgba(0,0,0,.35)');v.addColorStop(.3,'rgba(0,0,0,0)');v.addColorStop(.75,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');
    ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  }else if(style==='pitch'){
    // Alternating mowed stripes plus pitch markings seen from above.
    ctx.fillStyle=text;for(let i=0;i<12;i+=2){ctx.globalAlpha=.035;ctx.fillRect(0,i*H/12,W,H/12)}
    ctx.strokeStyle=text;ctx.lineWidth=5;ctx.globalAlpha=.13;
    ctx.strokeRect(60,60,W-120,H-120);ctx.beginPath();ctx.moveTo(60,H/2);ctx.lineTo(W-60,H/2);ctx.stroke();
    ctx.beginPath();ctx.arc(W/2,H/2,190,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,9,0,Math.PI*2);ctx.fillStyle=text;ctx.fill();
    ctx.strokeRect(W/2-330,60,660,290);ctx.strokeRect(W/2-150,60,300,110);ctx.strokeRect(W/2-330,H-350,660,290);ctx.strokeRect(W/2-150,H-170,300,110);
    ctx.beginPath();ctx.arc(W/2,350,110,.2*Math.PI,.8*Math.PI);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H-350,110,1.2*Math.PI,1.8*Math.PI);ctx.stroke();
    ctx.globalAlpha=1;
  }else if(style==='stripes'){
    // Bold diagonal kit stripes in the accent colour.
    ctx.save();ctx.translate(W/2,H/2);ctx.rotate(-.42);ctx.fillStyle=accent;ctx.globalAlpha=.13;
    for(let i=-14;i<14;i+=2)ctx.fillRect(i*95,-H,95,H*2);ctx.restore();ctx.globalAlpha=1;
    const v=ctx.createLinearGradient(0,0,0,H);v.addColorStop(0,background);v.addColorStop(.18,'rgba(0,0,0,0)');v.addColorStop(.82,'rgba(0,0,0,0)');v.addColorStop(1,background);
    ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  }else if(style==='halftone'){
    // Dot grid that fades from the top-right corner, like a printed matchday programme.
    ctx.fillStyle=accent;
    for(let gy=0;gy<H;gy+=36)for(let gx=0;gx<W;gx+=36){const d=Math.hypot(W-gx,gy)/Math.hypot(W,H),r=Math.max(0,9*(1-d*1.6));if(r>.6){ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(gx,gy,r,0,Math.PI*2);ctx.fill()}}
    for(let gy=0;gy<H;gy+=36)for(let gx=0;gx<W;gx+=36){const d=Math.hypot(gx,H-gy)/Math.hypot(W,H),r=Math.max(0,9*(1-d*1.8));if(r>.6){ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(gx,gy,r,0,Math.PI*2);ctx.fill()}}
    ctx.globalAlpha=1;
  }
  // Team crest as a large, faint watermark behind the content.
  if(logos[0]&&style!=='pitch'){const size=980,ratio=Math.min(size/logos[0].width,size/logos[0].height);ctx.globalAlpha=.05;ctx.drawImage(logos[0],W/2-logos[0].width*ratio/2,1230-logos[0].height*ratio/2,logos[0].width*ratio,logos[0].height*ratio);ctx.globalAlpha=1}
  ctx.fillStyle=text;ctx.globalAlpha=.035;
  for(let i=0;i<30000;i++){const a=random()*W,b=random()*H;ctx.fillRect(a,b,random()*3+1,1)}ctx.globalAlpha=1;
  if(style==='poster'){
    // Diagonal marks echo a printed football poster.
    const slash=(px,py,w,h)=>{ctx.fillStyle=accent;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+w,py);ctx.lineTo(px+w+h,py+h);ctx.lineTo(px+h,py+h);ctx.closePath();ctx.fill()};
    slash(-100,180,75,300);slash(-160,180,42,300);slash(925,330,90,170);slash(925,455,90,170);
    slash(-120,1560,70,260);slash(960,1380,60,220);
    ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(18,145);ctx.lineTo(178,630);ctx.moveTo(32,112);ctx.lineTo(210,550);ctx.stroke();ctx.globalAlpha=1;
    const cross=(a,b,size)=>{ctx.save();ctx.translate(a,b);ctx.rotate(.65);ctx.fillStyle=accent;ctx.fillRect(-size/2,-4,size,8);ctx.fillRect(-4,-size/2,8,size);ctx.restore()};
    cross(104,700,34);if(!options.full){cross(976,1160,40);cross(930,1205,22);cross(120,1420,28)}
  }

  // The full variant shrinks the title so the player stats fit inside the same 9:16 frame.
  const L=options.full
    ?{header:230,title:400,titleSize:150,script:455,scriptSize:100,curve:490,pill:515,pillH:60,pillSize:34,board:610,info:1560,row:34,names:260,gap:40}
    :{header:250,title:490,titleSize:230,script:560,scriptSize:148,curve:600,pill:650,pillH:70,pillSize:40,board:780,info:1560,row:40,names:290,gap:50};
  ctx.textAlign='center';ctx.fillStyle=text;ctx.font=font(26);ctx.globalAlpha=.8;
  ctx.fillText((played?'RISULTATO FINALE':'PROSSIMA PARTITA')+' / ROSA360',W/2,L.header);ctx.globalAlpha=1;
  ctx.font=font(L.titleSize,true);ctx.fillText('MATCH',W/2,L.title,820);
  ctx.save();ctx.translate(W/2,L.script);ctx.rotate(-.055);ctx.font=`700 italic ${L.scriptSize}px Caveat, cursive`;ctx.lineWidth=7;ctx.strokeStyle=background;ctx.strokeText(played?'Result':'Day',0,0,830);ctx.fillStyle=accent;ctx.fillText(played?'Result':'Day',0,0,830);ctx.restore();
  ctx.strokeStyle=text;ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(275,L.curve);ctx.quadraticCurveTo(550,L.curve-28,815,L.curve);ctx.stroke();

  if(outcome){
    ctx.font=font(L.pillSize,true);const w=ctx.measureText(outcome.label).width+80;
    ctx.fillStyle=outcome.color;reportRoundRect(ctx,W/2-w/2,L.pill,w,L.pillH,L.pillH/2);ctx.fill();
    ctx.fillStyle='#101216';ctx.fillText(outcome.label,W/2,L.pill+L.pillH/2+L.pillSize*.36);
  }

  const boardTop=L.board;
  logos.forEach((img,i)=>{
    const cx=i?902:178;ctx.fillStyle='#f5f4ed';ctx.fillRect(cx-83,boardTop+28,166,166);
    if(img){const ratio=Math.min(146/img.width,146/img.height);ctx.drawImage(img,cx-img.width*ratio/2,boardTop+111-img.height*ratio/2,img.width*ratio,img.height*ratio)}
    else{ctx.fillStyle='#19211d';ctx.font=font(48,true);ctx.fillText(((i?x.opp:team.name)||'S').slice(0,2).toUpperCase(),cx,boardTop+131)}
  });
  [390,690].forEach((cx,i)=>{
    const winner=played&&(i?ga>gf:gf>ga);
    ctx.fillStyle=winner?accent:text;ctx.fillRect(cx-78,boardTop,156,222);ctx.fillStyle=background;ctx.font=font(124,true);
    ctx.fillText(played?String(i?x.ga:x.gf):'–',cx,boardTop+170,142);
  });
  ctx.fillStyle=text;ctx.font=font(60,true);ctx.fillText('VS',W/2,boardTop+140);

  ctx.font=font(36,true);
  const names=[wrapReport(ctx,(team.name||'Squadra').toUpperCase(),420).slice(0,2),wrapReport(ctx,(x.opp||'Avversari').toUpperCase(),420).slice(0,2)];
  const namesTop=boardTop+L.names;
  names.forEach((name,i)=>name.forEach((line,j)=>ctx.fillText(line,i?810:270,namesTop+j*46)));
  let y=namesTop+Math.max(...names.map(n=>n.length))*46+L.gap;
  const infoTop=L.info;

  // Only our scorers: opponents' goals aren't tracked by name.
  if(played&&gf>0){
    ctx.fillStyle=accent;ctx.fillRect(W/2-60,y-22,120,4);
    ctx.fillStyle=text;ctx.font=font(22);ctx.globalAlpha=.7;ctx.fillText('MARCATORI '+(team.name||'').toUpperCase(),W/2,y+20,900);ctx.globalAlpha=1;
    ctx.font=font(34,true);
    const list=reportScorers(x);
    const shown=list.length?(list.length>3?[...list.slice(0,2),'+'+(list.length-2)+' ALTRI']:list):['Marcatori non registrati'];
    shown.forEach((line,j)=>ctx.fillText(reportFit(ctx,line.toUpperCase(),900),W/2,y+66+j*46));
    y+=66+shown.length*46+(options.full?14:30);
  }

  if(options.full){
    const {players,staff}=reportPlayerStats(x);
    const bottom=infoTop-50,rowH=L.row;
    if(players.length&&y+90<bottom){
      ctx.fillStyle=text;ctx.font=font(22);ctx.globalAlpha=.7;ctx.fillText('PRESENTI · '+players.length+' GIOCATORI',W/2,y+10);ctx.globalAlpha=1;
      y+=50;
      const maxRows=Math.max(1,Math.floor((bottom-y-(staff.length?40:0))/rowH));
      const capacity=maxRows*2,overflow=players.length>capacity;
      const cells=overflow?players.slice(0,capacity-1):players;
      const perCol=Math.ceil(cells.length/2);
      cells.forEach((p,k)=>{
        const col=k<perCol?0:1,row=col?k-perCol:k,left=col?570:110,ry=y+row*rowH;
        ctx.textAlign='left';ctx.fillStyle=text;ctx.font=font(26,true);ctx.fillText(reportFit(ctx,p.nick,210),left,ry+28);
        ctx.textAlign='right';ctx.globalAlpha=.75;ctx.font=font(22);ctx.fillText(reportFit(ctx,p.stats,180),left+400,ry+28);ctx.globalAlpha=1;
      });
      if(overflow){ctx.textAlign='right';ctx.fillStyle=accent;ctx.font=font(24,true);ctx.fillText('+'+(players.length-cells.length)+' ALTRI',970,y+(maxRows-1)*rowH+28)}
      y+=Math.max(perCol,overflow?maxRows:0)*rowH+10;ctx.textAlign='center';
      if(staff.length&&y+30<bottom){ctx.fillStyle=text;ctx.globalAlpha=.7;ctx.font=font(22);ctx.fillText(reportFit(ctx,'DIRIGENTI: '+staff.join(', ').toUpperCase(),900),W/2,y+24);ctx.globalAlpha=1}
    }
  }

  // A rough paper edge separates the fixture details from the scoreboard.
  ctx.fillStyle=text;ctx.beginPath();ctx.moveTo(0,infoTop-27);
  for(let a=0;a<=W;a+=18)ctx.lineTo(a,infoTop-27+random()*15);ctx.lineTo(W,infoTop-12);ctx.lineTo(0,infoTop-12);ctx.closePath();ctx.fill();
  ctx.textAlign='center';ctx.fillStyle=accent;ctx.font=font(30,true);
  ctx.fillText(reportFit(ctx,(x.tourn||'Amichevole').toUpperCase(),900),W/2,infoTop+48);
  ctx.fillStyle=text;ctx.font=font(28);
  const info=[[dt(x.date).f,x.time?'ORE '+x.time:''].filter(Boolean).join(' · '),matchPlace(x)||'Luogo non indicato'];
  info.forEach((line,j)=>ctx.fillText(reportFit(ctx,line.toUpperCase(),900),W/2,infoTop+96+j*44));
  ctx.fillStyle=accent;ctx.fillRect(W/2-75,infoTop+170,150,5);

  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Immagine non disponibile')),'image/png'));
}
// ===== Formazione: storia 1080×1920 con maglie numerate =====
const FORMATION_LAYOUTS=[['campo','Campo'],['lavagna','Lavagna'],['spogliatoio','Spogliatoio'],['poster','Poster']];
function formationBench(x){const ids=new Set(formationData(x).players.filter(Boolean).map(String)),present=new Set((x.present||[]).map(String));return S.members.filter(m=>m.tid===x.tid&&m.role==='giocatore'&&present.has(String(m.id))&&!ids.has(String(m.id)))}
function formationPositions(scheme){return ({
  "3-1":[[.5,.83],[.18,.47],[.5,.53],[.82,.47],[.5,.16]],
  "2-2":[[.5,.83],[.27,.54],[.73,.54],[.27,.2],[.73,.2]],
  "1-2-1":[[.5,.84],[.5,.58],[.18,.38],[.82,.38],[.5,.14]],
  "4-0":[[.5,.83],[.13,.44],[.38,.36],[.62,.36],[.87,.44]]
})[scheme]||formationPositions("3-1")}
function fitFormationName(ctx,name,maxWidth,maxSize=29,minSize=17){let size=maxSize;while(size>minSize){ctx.font=`700 ${size}px Oswald, sans-serif`;if(ctx.measureText(name).width<=maxWidth)return size;size--}return minSize}
function fxRgb(h){h=String(h||'#000000').replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');const n=parseInt(h,16)||0;return [n>>16&255,n>>8&255,n&255]}
function fxMix(h,t,a){const p=fxRgb(h),q=fxRgb(t);return 'rgb('+p.map((v,i)=>Math.round(v+(q[i]-v)*a)).join(',')+')'}
function fxContrast(h){const [r,g,b]=fxRgb(h);return (r*299+g*587+b*114)/1000>150?'#111111':'#ffffff'}
function formationRoleName(label){return ({P:'Portiere',D:'Difesa',C:'Centrocampo',A:'Attacco',G:'Universale'})[String(label||'')[0]]||''}
function jerseyPath(ctx,cx,top,w){
  const h=w*.96,p=[[-.15,0],[-.36,.05],[-.5,.27],[-.39,.4],[-.3,.32],[-.3,.98],[.3,.98],[.3,.32],[.39,.4],[.5,.27],[.36,.05],[.15,0]];
  ctx.beginPath();p.forEach(([a,b],i)=>i?ctx.lineTo(cx+a*w,top+b*h):ctx.moveTo(cx+a*w,top+b*h));ctx.quadraticCurveTo(cx,top+h*.16,cx-.15*w,top);ctx.closePath();return h;
}
// Maglia vettoriale: colore pieno, ombreggiatura, colletto e polsini nel colore del numero.
function drawJersey(ctx,cx,top,w,o){
  ctx.save();ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=w*.14;ctx.shadowOffsetY=w*.05;const h=jerseyPath(ctx,cx,top,w);ctx.fillStyle=o.shirt;ctx.fill();ctx.restore();
  ctx.save();jerseyPath(ctx,cx,top,w);ctx.clip();
  const g=ctx.createLinearGradient(cx-w/2,top,cx+w/2,top+h);g.addColorStop(0,'rgba(255,255,255,.24)');g.addColorStop(.45,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.28)');ctx.fillStyle=g;ctx.fillRect(cx-w/2,top,w,h);
  ctx.fillStyle='rgba(0,0,0,.13)';ctx.fillRect(cx-.3*w,top+.32*h,w*.06,h);ctx.fillRect(cx+.24*w,top+.32*h,w*.06,h);
  ctx.strokeStyle=o.num;ctx.lineWidth=w*.07;ctx.beginPath();ctx.moveTo(cx-.5*w,top+.27*h);ctx.lineTo(cx-.39*w,top+.4*h);ctx.moveTo(cx+.5*w,top+.27*h);ctx.lineTo(cx+.39*w,top+.4*h);ctx.stroke();
  ctx.restore();
  ctx.beginPath();ctx.moveTo(cx-.15*w,top);ctx.quadraticCurveTo(cx,top+h*.16,cx+.15*w,top);ctx.strokeStyle=o.num;ctx.lineWidth=w*.04;ctx.lineCap='round';ctx.stroke();ctx.lineCap='butt';
  jerseyPath(ctx,cx,top,w);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=Math.max(2,w*.012);ctx.stroke();
  const n=String(o.number??'').trim();
  if(n){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.round(w*(n.length>1?.4:.46))}px Oswald, sans-serif`;ctx.lineJoin='round';ctx.lineWidth=w*.03;ctx.strokeStyle=fxMix(o.shirt,'#000000',.45);ctx.strokeText(n,cx,top+h*.63);ctx.fillStyle=o.num;ctx.fillText(n,cx,top+h*.63);ctx.textBaseline='alphabetic'}
  if(o.captain){const r=w*.1,bx=cx+.36*w,by=top+.12*h;ctx.fillStyle=o.badge;ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=fxContrast(o.badge);ctx.textAlign='center';ctx.font=`700 ${Math.round(r*1.3)}px Oswald, sans-serif`;ctx.fillText('C',bx,by+r*.45)}
  return h;
}
// Maglia + soprannome sotto. Restituisce la y del bordo inferiore.
function jerseyCard(ctx,m,cx,top,w,P,o={}){
  const keeper=o.keeper??m.pos==='P',shirt=keeper?P.keeper:P.shirt,num=keeper?fxContrast(P.keeper):P.number;
  const h=drawJersey(ctx,cx,top,w,{shirt,num,number:m.num,captain:m.captain,badge:P.accent});
  const label=(m.nick||m.name||'').toUpperCase(),size=fitFormationName(ctx,label,o.maxW||w*1.2,o.size||Math.round(w*.17),14);
  ctx.font=`700 ${size}px Oswald, sans-serif`;const ph=Math.round(size*1.55),pw=Math.max(ctx.measureText(label).width+size*1.2,ph*1.8),py=top+h+w*.07;
  if(o.plate!==false){ctx.fillStyle=o.plate||'rgba(8,10,12,.86)';reportRoundRect(ctx,cx-pw/2,py,pw,ph,ph/2);ctx.fill()}
  ctx.fillStyle=o.ink||P.text;ctx.textAlign='center';ctx.fillText(label,cx,py+ph*.71);
  let bottom=py+ph;
  if(o.role){ctx.globalAlpha=.7;ctx.font=`500 ${Math.round(size*.72)}px Oswald, sans-serif`;ctx.fillStyle=o.roleInk||P.text;ctx.fillText(o.role.toUpperCase(),cx,bottom+size*.95);ctx.globalAlpha=1;bottom+=size*1.2}
  return bottom;
}
function formationHeader(ctx,x,team,P,logos,top,ink,kicker=true,kickerText='FORMAZIONE UFFICIALE'){
  const W=1080,font=(n,b=true)=>`${b?'700':'500'} ${n}px Oswald, sans-serif`;ctx.textAlign='center';
  if(kicker){ctx.fillStyle=P.accent;ctx.font=font(30);if('letterSpacing' in ctx)ctx.letterSpacing='8px';ctx.fillText(kickerText,W/2,top);if('letterSpacing' in ctx)ctx.letterSpacing='0px'}
  const name=(team.name||'SQUADRA').toUpperCase();ctx.fillStyle=ink;ctx.font=font(fitFormationName(ctx,name,logos.some(Boolean)?620:900,96,48));ctx.fillText(name,W/2,top+100);
  ctx.fillStyle=kicker?P.accent:ink;const opp='VS '+(x.opp||'AVVERSARIO').toUpperCase();ctx.font=font(fitFormationName(ctx,opp,800,58,32));ctx.fillText(opp,W/2,top+172);
  ctx.fillStyle=ink;ctx.globalAlpha=.82;ctx.font=font(27,false);ctx.fillText(reportFit(ctx,[dt(x.date).f,x.time?'ORE '+x.time:'',matchPlace(x)].filter(Boolean).join('   ·   ').toUpperCase(),920),W/2,top+226);ctx.globalAlpha=1;
  for(const [img,cx] of [[logos[0],120],[logos[1],960]])if(img){const r=Math.min(120/img.width,120/img.height);ctx.drawImage(img,cx-img.width*r/2,top+70-img.height*r/2,img.width*r,img.height*r)}
}
function futsalLines(ctx,px,py,pw,ph,color,width){
  const cx=px+pw/2,ins=24;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.strokeRect(px+ins,py+ins,pw-ins*2,ph-ins*2);
  ctx.beginPath();ctx.moveTo(px+ins,py+ph/2);ctx.lineTo(px+pw-ins,py+ph/2);ctx.stroke();ctx.beginPath();ctx.arc(cx,py+ph/2,100,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(cx,py+ins,175,0,Math.PI);ctx.stroke();ctx.beginPath();ctx.arc(cx,py+ph-ins,175,Math.PI,Math.PI*2);ctx.stroke();
  ctx.fillStyle=color;for(const y of [py+ph/2,py+ins+120,py+ph-ins-120]){ctx.beginPath();ctx.arc(cx,y,7,0,Math.PI*2);ctx.fill()}
  ctx.strokeRect(cx-60,py+ins-22,120,22);ctx.strokeRect(cx-60,py+ph-ins,120,22);
}
function drawStarters(ctx,x,P,area,w,o){
  const f=formationData(x),labels=FORMATIONS[f.scheme]||FORMATIONS['3-1'],pos=formationPositions(f.scheme);
  f.players.forEach((id,i)=>{const m=id&&S.members.find(q=>String(q.id)===String(id));if(!m||!pos[i])return;const cx=area.x+area.w*pos[i][0],cy=area.y+area.h*pos[i][1];jerseyCard(ctx,m,cx,cy-w*.62,w,P,{...o,keeper:labels[i]==='P'})});
}
function drawBench(ctx,bench,P,top,o={}){
  if(!bench.length)return top;const W=1080,ink=o.ink||P.text;
  ctx.textAlign='center';ctx.fillStyle=ink;ctx.font='700 34px Oswald, sans-serif';if('letterSpacing' in ctx)ctx.letterSpacing='6px';ctx.fillText(o.title||'PANCHINA',W/2,top);if('letterSpacing' in ctx)ctx.letterSpacing='0px';
  ctx.fillStyle=P.accent;ctx.fillRect(W/2-60,top+16,120,5);
  const per=6,shown=bench.slice(0,o.max||12),rows=Math.ceil(shown.length/per);let y=top+52,bottom=y;
  for(let r=0;r<rows;r++){const row=shown.slice(r*per,r*per+per),gap=150,x0=W/2-(row.length-1)*gap/2;row.forEach((m,i)=>{bottom=jerseyCard(ctx,m,x0+i*gap,y,92,P,{plate:false,ink,size:22,maxW:140})});y+=158}
  if(bench.length>shown.length){ctx.fillStyle=ink;ctx.font='500 24px Oswald, sans-serif';ctx.fillText('+'+(bench.length-shown.length)+' ALTRI',W/2,bottom+34);bottom+=40}
  return bottom;
}
function formationFooter(ctx,color,y=1838,text='Forza ragazzi'){const W=1080;ctx.textAlign='center';ctx.fillStyle=color;ctx.font='700 italic 78px Caveat, cursive';ctx.fillText(text,W/2,y);ctx.strokeStyle=color;ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(380,y+16);ctx.quadraticCurveTo(540,y+34,700,y+16);ctx.stroke();ctx.lineCap='butt'}
async function formationStoryBlob(x,options={}){
  if(document.fonts){await Promise.all([document.fonts.load('700 150px Oswald'),document.fonts.load('500 30px Oswald'),ensureCaveat()]).catch(()=>{});await document.fonts.ready;}
  const {team}=reportLines(x),W=1080,H=1920,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=W;canvas.height=H;
  const P=options.palette||formationDefaults(team,await reportPalette(team)),layout=options.layout||'campo',bench=formationBench(x),logos=await Promise.all([reportLogo(team.logo),reportLogo(x.oppLogo)]);
  const bg=P.background;ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  if(layout==='campo'){
    const glow=ctx.createRadialGradient(W/2,0,60,W/2,0,1100);glow.addColorStop(0,P.accent);glow.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=.35;ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
    formationHeader(ctx,x,team,P,logos,140,P.text);
    const px=80,py=420,pw=920,ph=980;ctx.save();reportRoundRect(ctx,px,py,pw,ph,30);ctx.clip();for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#1c6340':'#21704a';ctx.fillRect(px,py+i*ph/10,pw,ph/10+1)}
    const v=ctx.createRadialGradient(W/2,py+ph/2,200,W/2,py+ph/2,720);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=v;ctx.fillRect(px,py,pw,ph);
    futsalLines(ctx,px,py,pw,ph,'rgba(255,255,255,.75)',5);ctx.restore();
    drawStarters(ctx,x,P,{x:px,y:py,w:pw,h:ph},172,{});
    drawBench(ctx,bench,P,1470);formationFooter(ctx,P.accent);
  }else if(layout==='lavagna'){
    ctx.fillStyle=P.text;ctx.globalAlpha=.07;for(let gx=30;gx<W;gx+=44)for(let gy=30;gy<H;gy+=44){ctx.beginPath();ctx.arc(gx,gy,2,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
    formationHeader(ctx,x,team,P,logos,140,P.text);
    const px=60,py=420,pw=960,ph=1000,f=formationData(x);
    ctx.save();ctx.globalAlpha=.1;ctx.fillStyle=P.accent;ctx.textAlign='center';ctx.font='700 420px Oswald, sans-serif';ctx.fillText(f.scheme,W/2,py+ph/2+150);ctx.restore();
    ctx.save();ctx.setLineDash([18,14]);futsalLines(ctx,px,py,pw,ph,fxMix(P.text,bg,.7),4);ctx.restore();
    drawStarters(ctx,x,P,{x:px,y:py,w:pw,h:ph},176,{plate:P.accent,ink:fxContrast(P.accent)});
    drawBench(ctx,bench,P,1490);formationFooter(ctx,P.accent);
  }else if(layout==='spogliatoio'){
    for(let i=0;i<W;i+=180){ctx.fillStyle=i/180%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.12)';ctx.fillRect(i,0,180,H);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(i,0,3,H)}
    const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(0,0,0,.35)');shade.addColorStop(.4,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.4)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
    formationHeader(ctx,x,team,P,logos,140,P.text);
    const f=formationData(x),labels=FORMATIONS[f.scheme]||FORMATIONS['3-1'],slots=f.players.map((id,i)=>({m:id&&S.members.find(q=>String(q.id)===String(id)),label:labels[i]})).filter(s=>s.m);
    const rails=[[560,slots.slice(0,3)],[1010,slots.slice(3,5)]];
    for(const [ry,row] of rails){if(!row.length)continue;ctx.fillStyle=fxMix(P.accent,'#000000',.2);reportRoundRect(ctx,90,ry-9,900,18,9);ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(100,ry-6,880,4);
      const gap=320,x0=W/2-(row.length-1)*gap/2;row.forEach((s,i)=>{const cx=x0+i*gap,w=230,top=ry+64;
        ctx.strokeStyle='#c9ccd1';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.arc(cx,ry+4,16,Math.PI,Math.PI*2.4);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,ry+22);ctx.lineTo(cx-w*.38,top+10);ctx.moveTo(cx,ry+22);ctx.lineTo(cx+w*.38,top+10);ctx.stroke();ctx.lineCap='butt';
        jerseyCard(ctx,s.m,cx,top,w,P,{keeper:s.label==='P',role:formationRoleName(s.label),size:34,maxW:290})})}
    drawBench(ctx,bench,P,1500);formationFooter(ctx,P.accent);
  }else{
    const ink=fxContrast(P.accent);ctx.fillStyle=P.accent;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,560);ctx.lineTo(0,720);ctx.closePath();ctx.fill();
    ctx.save();ctx.globalAlpha=.12;ctx.fillStyle=ink;ctx.font='700 300px Oswald, sans-serif';ctx.textAlign='left';ctx.fillText('LINE',-20,330);ctx.fillText('UP',560,640);ctx.restore();
    ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(0,736);ctx.lineTo(W,576);ctx.lineTo(W,592);ctx.lineTo(0,752);ctx.closePath();ctx.globalAlpha=.6;ctx.fill();ctx.globalAlpha=1;
    ctx.save();ctx.translate(W/2,150);ctx.rotate(-.05);ctx.fillStyle=ink;ctx.textAlign='center';ctx.font='700 italic 110px Caveat, cursive';ctx.fillText('Matchday',0,0);ctx.restore();
    formationHeader(ctx,x,team,P,logos,210,ink,false);
    drawStarters(ctx,x,P,{x:80,y:650,w:920,h:840},168,{plate:P.accent,ink});
    drawBench(ctx,bench,P,1520,{max:6});formationFooter(ctx,P.accent,1850);
  }
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Immagine non disponibile')),'image/png'));
}
function formationDefaults(team,base){const shirt=/^#[0-9a-f]{6}$/i.test(team.color||'')?team.color:base.accent,dark=fxContrast(shirt)==='#ffffff';return {...base,shirt,number:fxContrast(shirt),keeper:dark?'#f2c230':'#1d2026'}}
const FORMATION_COLORS=[['accent','Accento'],['background','Sfondo'],['text','Testo'],['shirt','Maglia'],['number','Numero'],['keeper','Portiere']];
async function previewFormation(id){
  const saved=S.matches.find(m=>m.id===id);if(!saved)return;const x={...saved,...matchDetail(saved)};
  document.getElementById('formation-dialog')?.remove();
  const picker=([k,l])=>`<label>${l}<input id="formation-${k}" type="color"></label>`;
  const dialog=document.createElement('dialog');dialog.id='formation-dialog';dialog.innerHTML=`<h2 style="margin:0">Condividi formazione</h2><p class="mu">Storia 9:16 con maglia, numero e soprannome dei titolari.</p><div class="seg" id="formation-layouts">${FORMATION_LAYOUTS.map(([k,n])=>`<button type="button" data-l="${k}">${n}</button>`).join('')}</div><fieldset class="report-colors"><legend>Colori dell’immagine</legend>${FORMATION_COLORS.slice(0,3).map(picker).join('')}</fieldset><fieldset class="report-colors"><legend>Colori delle maglie</legend>${FORMATION_COLORS.slice(3).map(picker).join('')}</fieldset><button id="formation-reset" class="s">Ripristina lo stile del profilo</button><p id="formation-status">Generazione immagine…</p><div id="formation-image"></div><div class="row"><button id="formation-share" class="p" disabled>Condividi immagine</button><button id="formation-download" disabled>Scarica PNG</button><button id="formation-close">Chiudi</button></div>`;
  document.body.append(dialog);const q=s=>dialog.querySelector(s);q('#formation-close').onclick=()=>dialog.close();dialog.showModal();let url,file,version=0;
  dialog.addEventListener('close',()=>{version++;if(url)URL.revokeObjectURL(url);dialog.remove()},{once:true});
  const team=S.teams.find(t=>t.id===x.tid)||{},defaults=formationDefaults(team,await reportPalette(team));
  const pref=teamShareStyle(team,'formation');
  let layout=FORMATION_LAYOUTS.some(([k])=>k===pref.layout)?pref.layout:'campo';
  const setColors=c=>{for(const [k] of FORMATION_COLORS)q('#formation-'+k).value=/^#[0-9a-f]{6}$/i.test(c[k]||'')?c[k]:defaults[k]};setColors(pref.palette||defaults);
  const markLayout=()=>dialog.querySelectorAll('#formation-layouts button').forEach(b=>b.classList.toggle('on',b.dataset.l===layout));markLayout();
  const filename='formazione-'+x.date+'-'+String(x.opp||'').replace(/[^a-zA-Z0-9à-ÿ_-]/g,'-')+'.png';
  const download=()=>{if(!url)return;const a=document.createElement('a');a.href=url;a.download=filename;a.click()};q('#formation-download').onclick=download;
  const renderImage=async()=>{const v=++version;try{
    const palette=Object.fromEntries(FORMATION_COLORS.map(([k])=>[k,q('#formation-'+k).value]));
    const blob=await formationStoryBlob(x,{palette,layout});if(v!==version||!dialog.open)return;const old=url;url=URL.createObjectURL(blob);if(old)URL.revokeObjectURL(old);file=new File([blob],filename,{type:'image/png'});
    const img=new Image();img.src=url;img.alt='Formazione contro '+(x.opp||'avversario');img.style.cssText='display:block;height:min(60vh,640px);width:auto;max-width:100%;margin:0 auto;border-radius:12px';q('#formation-image').replaceChildren(img);
    const share=!!navigator.canShare?.({files:[file]});q('#formation-status').textContent=share?'Immagine pronta: puoi condividerla e scegliere Instagram.':'Immagine pronta. Scarica il PNG per pubblicarlo nelle storie.';q('#formation-share').disabled=false;q('#formation-download').disabled=false;q('#formation-share').textContent=share?'Condividi immagine':'Salva immagine';
    q('#formation-share').onclick=async()=>{if(!share)return download();try{await navigator.share({files:[file],title:'Formazione - '+(x.opp||'')})}catch(e){if(e.name!=='AbortError')q('#formation-status').textContent='Condivisione non riuscita. Usa Scarica PNG.'}}}catch{if(v===version)q('#formation-status').textContent='Impossibile generare l’immagine.'}};
  dialog.querySelectorAll('#formation-layouts button').forEach(b=>b.onclick=()=>{layout=b.dataset.l;markLayout();renderImage()});
  FORMATION_COLORS.forEach(([k])=>q('#formation-'+k).addEventListener('input',renderImage));q('#formation-reset').onclick=()=>{setColors(pref.palette||defaults);renderImage()};await renderImage();
}
// ===== Risultato: storia 1080×1920 con maglie, nello stile della formazione =====
const RESULT_LAYOUTS=[['campo','Campo'],['lavagna','Lavagna'],['spogliatoio','Spogliatoio'],['poster','Poster']];
function resultData(x){
  const st=x.stats||{},mem=id=>S.members.find(m=>String(m.id)===String(id)&&m.tid===x.tid&&m.role==='giocatore');
  const all=Object.keys(st).map(id=>({m:mem(id),g:+st[id].g||0,a:+st[id].a||0,y:+st[id].y||0,r:+st[id].r||0})).filter(e=>e.m);
  const present=(x.present||[]).map(mem).filter(Boolean),b=typeof mvp==='function'?mvp(x):null;
  return {cards:{y:all.filter(e=>e.y>0).map(e=>e.m.nick+(e.y>1?' ×'+e.y:'')),r:all.filter(e=>e.r>0).map(e=>e.m.nick+(e.r>1?' ×'+e.r:''))},gf:+x.gf||0,ga:+x.ga||0,played:!!x.played,present,
    scorers:all.filter(e=>e.g>0).sort((p,q)=>q.g-p.g||q.a-p.a),assists:all.filter(e=>e.a>0&&!e.g).sort((p,q)=>q.a-p.a),
    keeper:present.find(m=>m.pos==='P')||null,mvp:b&&b.m&&b.m.role==='giocatore'?b.m:null};
}
function resultOutcome(R){return !R.played?{label:'DA GIOCARE',color:'#8b95a3',foot:'Forza ragazzi'}:R.gf>R.ga?{label:'VITTORIA',color:'#2fbf71',foot:'Che squadra!'}:R.gf<R.ga?{label:'SCONFITTA',color:'#e5484d',foot:'Ci rifaremo'}:{label:'PAREGGIO',color:'#f5c518',foot:'Si va avanti'}}
function resultFigures(R){
  const f=[];if(!R.played)return f;const star=!!R.mvp&&!!R.keeper&&R.mvp.id===R.keeper.id;
  if(R.keeper)f.push({m:R.keeper,keeper:true,star,role:(star?'MVP · ':'')+(R.ga===0?'PORTA INVIOLATA':R.ga+(R.ga===1?' GOL SUBITO':' GOL SUBITI'))});
  if(R.mvp&&!star)f.push({m:R.mvp,star:true,role:'MVP'});
  return f;
}
const scorerItems=(R,max)=>R.scorers.slice(0,max).map(e=>({m:e.m,g:e.g,role:e.g+' GOL'+(e.a?' · '+e.a+' ASSIST':'')}));
function drawBall(ctx,cx,cy,r){
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=Math.max(2,r*.12);ctx.stroke();
  ctx.fillStyle='#111';ctx.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*2*Math.PI/5;ctx[i?'lineTo':'moveTo'](cx+Math.cos(a)*r*.48,cy+Math.sin(a)*r*.48)}ctx.closePath();ctx.fill();
}
function drawStar(ctx,cx,cy,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,d=i%2?r*.45:r;ctx[i?'lineTo':'moveTo'](cx+Math.cos(a)*d,cy+Math.sin(a)*d)}ctx.closePath()}
// Maglia con soprannome e ruolo + pallone (gol) o stella (MVP) sulla manica sinistra.
function rJersey(ctx,it,cx,top,w,P,o={}){
  const bottom=jerseyCard(ctx,it.m,cx,top,w,P,{...o,keeper:it.keeper,role:it.role}),r=w*.13,bx=cx-.36*w,by=top+.115*w;
  if(it.g){drawBall(ctx,bx,by,r);if(it.g>1){ctx.fillStyle=P.accent;ctx.beginPath();ctx.arc(bx+r*.9,by+r*.9,r*.68,0,Math.PI*2);ctx.fill();ctx.fillStyle=fxContrast(P.accent);ctx.font=`700 ${Math.round(r*.95)}px Oswald, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(it.g,bx+r*.9,by+r*.95);ctx.textBaseline='alphabetic'}}
  if(it.star){ctx.fillStyle='#ffd54a';drawStar(ctx,bx,by,r*1.25);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=3;ctx.stroke()}
  return bottom;
}
// Dispone le maglie su una o due file centrate; restituisce il bordo inferiore.
function placeResult(ctx,items,P,area,o={}){
  const n=items.length,cx0=area.x+area.w/2;ctx.textAlign='center';
  if(!n){ctx.fillStyle=P.text;ctx.globalAlpha=.6;ctx.font='500 30px Oswald, sans-serif';ctx.fillText(o.empty||'',cx0,area.y+50);ctx.globalAlpha=1;return area.y+80}
  const per=n<=(o.maxRow||3)?n:Math.ceil(n/2),w=o.w||(per<=2?230:per===3?205:175),gap=Math.min(area.w/per,w*1.55);let y=area.y,bottom=y;
  for(let i=0;i<n;i+=per){const row=items.slice(i,i+per),x0=cx0-(row.length-1)*gap/2;
    row.forEach((it,k)=>{bottom=Math.max(bottom,rJersey(ctx,it,x0+k*gap,y,w,P,{plate:o.plate,ink:o.ink,size:Math.round(w*.16),maxW:gap*.92}))});y=bottom+(o.rowGap||26)}
  if(o.more>0){ctx.textAlign='center';ctx.fillStyle=P.text;ctx.font='500 26px Oswald, sans-serif';ctx.fillText('+'+o.more+' ALTRI',cx0,bottom+36);bottom+=44}
  return bottom;
}
function resultLabel(ctx,text,y,color){ctx.textAlign='center';ctx.fillStyle=color;ctx.globalAlpha=.85;ctx.font='700 26px Oswald, sans-serif';if('letterSpacing' in ctx)ctx.letterSpacing='6px';ctx.fillText(text,540,y);if('letterSpacing' in ctx)ctx.letterSpacing='0px';ctx.globalAlpha=1}
function drawScore(ctx,R,P,cx,base,size,ink,dash){
  ctx.textBaseline='alphabetic';ctx.font=`700 ${size}px Oswald, sans-serif`;ctx.fillStyle=ink;
  ctx.textAlign='right';ctx.fillText(R.played?R.gf:'–',cx-size*.24,base);ctx.textAlign='left';ctx.fillText(R.played?R.ga:'–',cx+size*.24,base);
  ctx.fillStyle=dash||P.accent;ctx.fillRect(cx-size*.12,base-size*.36,size*.24,size*.07);ctx.textAlign='center';
}
function drawPill(ctx,O,cx,cy,size){ctx.font=`700 ${size}px Oswald, sans-serif`;ctx.textAlign='center';const w=ctx.measureText(O.label).width+size*2.2,h=size*1.9;ctx.fillStyle=O.color;reportRoundRect(ctx,cx-w/2,cy-h/2,w,h,h/2);ctx.fill();ctx.fillStyle='#101216';ctx.fillText(O.label,cx,cy+size*.36)}
function resultReport(ctx,x,R,P,top,limit,o={}){
  const L=170,Rt=910,nick=id=>(S.members.find(m=>String(m.id)===String(id))||{}).nick||'?',ev=(x.events||[]).filter(e=>e.k==='g'&&e.a);
  const known=id=>S.members.some(m=>String(m.id)===String(id)),evx=x.events||[],stx=x.stats||{},cardRows=[],saveRows=[];
  evx.forEach((v,i)=>{
    if((v.k==='y'||v.k==='r')&&known(v.p))cardRows.push({k:v.k,name:nick(v.p),min:v.m,i});
    else if(v.k==='ps')saveRows.push({k:'ps',name:known(v.gk)?nick(v.gk):'PORTIERE',min:v.m,i,gk:v.gk});
  });
  // Eventi inseriti a mano (solo statistiche, senza cronaca): restano visibili, senza minuto.
  Object.keys(stx).forEach(id=>{if(!known(id))return;
    for(const k of ['y','r']){const have=evx.filter(v=>v.k===k&&String(v.p)===String(id)).length;for(let c=have;c<(+stx[id][k]||0);c++)cardRows.push({k,name:nick(id),min:0,i:1e6})}
    const hs=evx.filter(v=>v.k==='ps'&&String(v.gk)===String(id)).length;for(let c=hs;c<(+stx[id].ps||0);c++)saveRows.push({k:'ps',name:nick(id),min:0,i:1e6})});
  cardRows.sort((p,q)=>p.i-q.i);saveRows.sort((p,q)=>p.i-q.i);
  const CAP=6,cardShow=cardRows.slice(0,CAP),saveShow=saveRows.slice(0,CAP),
    sec=(a,t)=>a.length?72+a.length*54+(t>a.length?44:0):0,reserve=sec(cardShow,cardRows.length)+sec(saveShow,saveRows.length);
  resultLabel(ctx,'MARCATORI',top,P.text);let y=top+34;ctx.textAlign='center';
  if(!R.scorers.length){ctx.fillStyle=P.text;ctx.globalAlpha=.6;ctx.font='500 30px Oswald, sans-serif';ctx.fillText(o.empty||'',540,y+40);ctx.globalAlpha=1;y+=80}
  else{
    const evAll=x.events||[],rows=[];
    R.scorers.forEach(e=>{const id=String(e.m.id);let c=0;
      evAll.forEach((v,i)=>{if(v.k==='g'&&String(v.p)===id&&c<e.g){c++;rows.push({e,i,min:v.m,cnt:0,as:v.a?[nick(v.a)]:[]})}});
      if(e.g>c)rows.push({e,i:1e6,min:0,cnt:e.g-c,as:[]})});
    rows.sort((p,q)=>p.i-q.i);rows.forEach(r=>{r.h=r.as.length?94:64});
    let n=0,acc=0;while(n<rows.length&&y+acc+rows[n].h+(n+1<rows.length?44:0)<=limit-reserve)acc+=rows[n++].h;n=Math.max(n,1);
    rows.slice(0,n).forEach(({e,as,h,min,cnt})=>{
      drawBall(ctx,L+26,y+30,22);ctx.textAlign='left';ctx.fillStyle=P.text;ctx.font='700 42px Oswald, sans-serif';ctx.fillText(reportFit(ctx,(e.m.nick||e.m.name||'').toUpperCase(),520),L+68,y+43);
      if(as.length){ctx.globalAlpha=.7;ctx.font='500 24px Oswald, sans-serif';ctx.fillText(reportFit(ctx,'ASSIST: '+as.join(', ').toUpperCase(),620),L+68,y+70);ctx.globalAlpha=1}
      {const bt=min?min+"'":cnt?String(cnt):'•';ctx.font='700 32px Oswald, sans-serif';const bw=Math.max(56,ctx.measureText(bt).width+28);
        ctx.fillStyle=P.accent;reportRoundRect(ctx,Rt-bw,y+4,bw,52,26);ctx.fill();ctx.fillStyle=fxContrast(P.accent);ctx.textAlign='center';ctx.fillText(bt,Rt-bw/2,y+41)}
      ctx.fillStyle=P.text;ctx.globalAlpha=.15;ctx.fillRect(L,y+h-6,Rt-L,2);ctx.globalAlpha=1;y+=h});
    if(n<rows.length){ctx.textAlign='center';ctx.fillStyle=P.text;ctx.globalAlpha=.8;ctx.font='500 26px Oswald, sans-serif';ctx.fillText('+'+(rows.length-n)+' ALTRI',540,y+30);ctx.globalAlpha=1;y+=44}
  }
  const drawEv=(a,tot,title)=>{if(!a.length)return;y+=28;resultLabel(ctx,title,y+22,P.text);y+=44;
    a.forEach(r=>{
      if(r.k==='ps'){ctx.fillStyle='#2fbf71';reportRoundRect(ctx,L,y+6,38,38,19);ctx.fill();ctx.fillStyle='#101216';ctx.font='700 24px Oswald, sans-serif';ctx.textAlign='center';ctx.fillText('P',L+19,y+33)}
      else{ctx.fillStyle=r.k==='y'?'#f5c518':'#e5484d';reportRoundRect(ctx,L+5,y+6,28,38,5);ctx.fill()}
      ctx.textAlign='left';ctx.fillStyle=P.text;ctx.font='500 30px Oswald, sans-serif';ctx.fillText(reportFit(ctx,r.name.toUpperCase(),Rt-L-170),L+52,y+36);
      const bt=r.min?r.min+"'":'•';ctx.font='700 28px Oswald, sans-serif';const bw=Math.max(52,ctx.measureText(bt).width+26);
      ctx.fillStyle=P.accent;reportRoundRect(ctx,Rt-bw,y+3,bw,44,22);ctx.fill();ctx.fillStyle=fxContrast(P.accent);ctx.textAlign='center';ctx.fillText(bt,Rt-bw/2,y+34);
      y+=54});
    if(tot>a.length){ctx.textAlign='center';ctx.fillStyle=P.text;ctx.globalAlpha=.8;ctx.font='500 26px Oswald, sans-serif';ctx.fillText('+'+(tot-a.length)+' ALTRI',540,y+30);ctx.globalAlpha=1;y+=44}};
  drawEv(cardShow,cardRows.length,'CARTELLINI');drawEv(saveShow,saveRows.length,'RIGORI PARATI');
  return y;
}
function resultPresent(ctx,R,P,top){
  const names=R.present.map(m=>m.nick).join(' · ');if(!names)return top;
  resultLabel(ctx,'PRESENTI · '+R.present.length,top,P.text);ctx.font='500 28px Oswald, sans-serif';ctx.fillStyle=P.text;ctx.globalAlpha=.8;ctx.textAlign='center';
  const ls=wrapReport(ctx,names,900).slice(0,3);ls.forEach((l,i)=>ctx.fillText(l,540,top+44+i*40));ctx.globalAlpha=1;return top+44+ls.length*40;
}
async function resultStoryBlob(x,options={}){
  if(document.fonts){await Promise.all([document.fonts.load('700 150px Oswald'),document.fonts.load('500 30px Oswald'),ensureCaveat()]).catch(()=>{});await document.fonts.ready;}
  const {team}=reportLines(x),W=1080,H=1920,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=W;canvas.height=H;
  const P=options.palette||formationDefaults(team,await reportPalette(team)),layout=options.layout||'campo',R=resultData(x),O=resultOutcome(R),bg=P.background;
  const logos=await Promise.all([reportLogo(team.logo),reportLogo(x.oppLogo)]),kick=(x.tourn||'Amichevole').toUpperCase().slice(0,28);
  const empty=R.played?(R.gf>0?'MARCATORI NON REGISTRATI':'NESSUN GOL A REFERTO'):'PARTITA DA GIOCARE',pres=top=>options.full?resultPresent(ctx,R,P,top):top;
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  if(layout==='campo'||layout==='lavagna'){
    const chalk=layout==='lavagna',px=chalk?60:80,py=420,pw=chalk?960:920,ph=chalk?1000:980,cy=py+ph/2;
    if(chalk){ctx.fillStyle=P.text;ctx.globalAlpha=.07;for(let gx=30;gx<W;gx+=44)for(let gy=30;gy<H;gy+=44){ctx.beginPath();ctx.arc(gx,gy,2,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
    else{const glow=ctx.createRadialGradient(W/2,0,60,W/2,0,1100);glow.addColorStop(0,P.accent);glow.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=.35;ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
    formationHeader(ctx,x,team,P,logos,140,P.text,true,kick);
    if(!chalk){ctx.save();reportRoundRect(ctx,px,py,pw,ph,30);ctx.clip();for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#1c6340':'#21704a';ctx.fillRect(px,py+i*ph/10,pw,ph/10+1)}
      const v=ctx.createRadialGradient(W/2,cy,200,W/2,cy,720);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=v;ctx.fillRect(px,py,pw,ph);futsalLines(ctx,px,py,pw,ph,'rgba(255,255,255,.75)',5);ctx.restore()}
    else{ctx.save();ctx.setLineDash([18,14]);futsalLines(ctx,px,py,pw,ph,fxMix(P.text,bg,.7),4);ctx.restore()}
    const pt=chalk?py+325:py+290;ctx.save();ctx.globalAlpha=chalk?.88:1;ctx.fillStyle=chalk?bg:'rgba(8,10,12,.55)';reportRoundRect(ctx,120,pt,840,py+ph-30-pt,28);ctx.fill();ctx.restore();
    if(chalk){drawScore(ctx,R,P,W/2,py+230,240,P.text);drawPill(ctx,O,W/2,py+290,32)}
    else{ctx.fillStyle='rgba(8,10,12,.8)';reportRoundRect(ctx,170,py+25,740,210,34);ctx.fill();ctx.strokeStyle=P.accent;ctx.lineWidth=4;ctx.stroke();drawScore(ctx,R,P,W/2,py+190,170,P.text);drawPill(ctx,O,W/2,py+235,30)}
    resultReport(ctx,x,R,P,pt+46,py+ph-50,{empty});pres(1480);formationFooter(ctx,P.accent,1838,O.foot);
  }else if(layout==='spogliatoio'){
    for(let i=0;i<W;i+=180){ctx.fillStyle=i/180%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.12)';ctx.fillRect(i,0,180,H);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(i,0,3,H)}
    const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(0,0,0,.35)');shade.addColorStop(.4,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.4)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
    formationHeader(ctx,x,team,P,logos,140,P.text,true,kick);
    const ink=fxContrast(P.accent);ctx.fillStyle=P.accent;reportRoundRect(ctx,190,410,700,220,30);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=5;ctx.stroke();
    drawScore(ctx,R,P,W/2,570,170,ink,ink);drawPill(ctx,O,W/2,632,30);
    resultReport(ctx,x,R,P,730,1500,{empty});pres(1540);formationFooter(ctx,P.accent,1838,O.foot);
  }else{
    const ink=fxContrast(P.accent);ctx.fillStyle=P.accent;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,560);ctx.lineTo(0,720);ctx.closePath();ctx.fill();
    ctx.save();ctx.globalAlpha=.12;ctx.fillStyle=ink;ctx.font='700 300px Oswald, sans-serif';ctx.textAlign='left';ctx.fillText('FULL',-20,330);ctx.fillText('TIME',560,640);ctx.restore();
    ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(0,736);ctx.lineTo(W,576);ctx.lineTo(W,592);ctx.lineTo(0,752);ctx.closePath();ctx.globalAlpha=.6;ctx.fill();ctx.globalAlpha=1;
    ctx.save();ctx.translate(W/2,150);ctx.rotate(-.05);ctx.fillStyle=ink;ctx.textAlign='center';ctx.font='700 italic 110px Caveat, cursive';ctx.fillText(R.played?'Result':'Matchday',0,0);ctx.restore();
    formationHeader(ctx,x,team,P,logos,210,ink,false,kick);
    drawScore(ctx,R,P,W/2,870,220,P.text,P.accent);drawPill(ctx,O,W/2,940,32);
    const b=resultReport(ctx,x,R,P,1030,1760,{empty});if(options.full&&b+40<1660)resultPresent(ctx,R,P,b+40);formationFooter(ctx,P.accent,1850,O.foot);
  }
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Immagine non disponibile')),'image/png'));
}
async function previewMatch(id){
  document.getElementById('report-dialog')?.close();
  const picker=([k,l])=>`<label>${l}<input id="report-${k}" type="color"></label>`,dialog=document.createElement('dialog');dialog.id='report-dialog';
  dialog.innerHTML=`<h2 style="margin:0">Condividi risultato</h2><p class="mu">Storia 9:16 con risultato, elenco marcatori e cartellini, nello stesso stile della formazione.</p><div class="seg" id="report-layouts">${RESULT_LAYOUTS.map(([k,n])=>`<button type="button" data-l="${k}">${n}</button>`).join('')}</div><fieldset class="report-colors"><legend>Colori dell’immagine</legend>${FORMATION_COLORS.slice(0,3).map(picker).join('')}</fieldset><fieldset class="report-colors" style="display:none"><legend>Colori delle maglie</legend>${FORMATION_COLORS.slice(3).map(picker).join('')}</fieldset><button id="report-reset" class="s">Ripristina lo stile del profilo</button><label class="report-full"><input id="report-full" type="checkbox"> Mostra anche l’elenco dei presenti</label><p id="report-status" role="status">Generazione immagine…</p><div id="report-image" aria-busy="true"></div><div class="row"><button id="report-share" class="p" disabled>Condividi immagine</button><button id="report-download" disabled>Scarica PNG</button><button id="report-close">Chiudi</button></div>`;
  document.body.append(dialog);const q=s=>dialog.querySelector(s);q('#report-close').onclick=()=>dialog.close();dialog.showModal();
  let url,file,version=0;dialog.addEventListener('close',()=>{version++;if(url)URL.revokeObjectURL(url);dialog.remove()},{once:true});
  try{
    const saved=S.matches.find(m=>m.id===id),x=canManage()?{id,...collectMatch(id),location:v('el'),time:v('eh'),field:v('ec')}:{...saved,...matchDetail(saved)};
    const team=S.teams.find(t=>t.id===x.tid)||{},defaults=formationDefaults(team,await reportPalette(team));if(!dialog.open)return;
    const pref=teamShareStyle(team,'result');
    let layout=RESULT_LAYOUTS.some(([k])=>k===pref.layout)?pref.layout:'campo';
    const setColors=c=>{for(const [k] of FORMATION_COLORS)q('#report-'+k).value=/^#[0-9a-f]{6}$/i.test(c[k]||'')?c[k]:defaults[k]};setColors(pref.palette||defaults);q('#report-full').checked=!!pref.full;
    const markLayout=()=>dialog.querySelectorAll('#report-layouts button').forEach(b=>b.classList.toggle('on',b.dataset.l===layout));markLayout();
    const filename='risultato-'+x.date+'-'+String(x.opp||'').replace(/[^a-zA-Z0-9à-ÿ_-]/g,'-')+'.png';
    const download=()=>{if(!url)return;const a=document.createElement('a');a.href=url;a.download=filename;a.click()};q('#report-download').onclick=download;
    const renderImage=async()=>{
      const current=++version;q('#report-share').disabled=q('#report-download').disabled=true;q('#report-image').setAttribute('aria-busy','true');q('#report-status').textContent='Aggiornamento immagine…';
      try{
        const palette=Object.fromEntries(FORMATION_COLORS.map(([k])=>[k,q('#report-'+k).value])),full=q('#report-full').checked;
        
        const blob=await resultStoryBlob(x,{palette,layout,full});if(!dialog.open||current!==version)return;
        const previous=url;url=URL.createObjectURL(blob);file=new File([blob],filename,{type:'image/png'});
        const img=new Image();img.src=url;img.alt='Risultato '+(team.name||'Squadra')+' – '+(x.opp||'')+' in formato storia';img.style.cssText='display:block;height:min(60vh,640px);width:auto;max-width:100%;margin:0 auto;border-radius:12px';
        q('#report-image').replaceChildren(img);if(previous)URL.revokeObjectURL(previous);
        const canShare=!!navigator.canShare?.({files:[file]});q('#report-status').textContent=canShare?'Immagine pronta: scegli Instagram e poi Storia.':'Immagine pronta. Scarica il PNG e caricalo nella tua storia.';
        q('#report-share').textContent=canShare?'Condividi immagine':'Salva immagine';q('#report-share').disabled=q('#report-download').disabled=false;
        q('#report-share').onclick=async()=>{if(!canShare)return download();try{await navigator.share({files:[file],title:'Risultato partita'})}catch(e){if(e.name!=='AbortError')q('#report-status').textContent='Condivisione non riuscita. Usa Scarica PNG.'}};
      }catch{if(dialog.open&&current===version)q('#report-status').textContent='Impossibile generare l’immagine. Modifica i colori o riprova.'}
      finally{if(dialog.open&&current===version)q('#report-image').setAttribute('aria-busy','false')}
    };
    dialog.querySelectorAll('#report-layouts button').forEach(b=>b.onclick=()=>{layout=b.dataset.l;markLayout();renderImage()});
    FORMATION_COLORS.forEach(([k])=>q('#report-'+k).addEventListener('input',renderImage));q('#report-full').onchange=renderImage;q('#report-reset').onclick=()=>{setColors(pref.palette||defaults);renderImage()};
    await renderImage();
  }catch{if(dialog.open)q('#report-status').textContent='Impossibile generare l’immagine. Chiudi e riprova.'}
}

// ===== Gol in diretta =====
let LIVE={mid:null,p:null,assist:false,pick:null,sc:undefined,popAt:0},LV={};
const lvEff=x=>{const o=LV[x.id];return o&&o.n>0?{...x,...o.d}:x};
const lvStat=(d,p)=>d.stats[p]||(d.stats[p]={g:0,a:0,og:0,y:0,r:0,gs:0});
const lvDec=(s,k)=>{if(s)s[k]=Math.max(0,(+s[k]||0)-1)};
function lvKeepers(cur){return (cur.present||[]).filter(i=>{const m=S.members.find(m=>m.id===i);return m&&m.role==='giocatore'&&m.pos==='P'})}
const rq=()=>{if(rq.t)return;rq.t=requestAnimationFrame(()=>{rq.t=0;render()})};
const lvBusy=()=>Object.values(LV).some(o=>o&&o.n>0);
function lvApply(id,fn){
  const base=S.matches.find(m=>m.id===id);if(!base)return;const bb=badgeKeys(base.tid);
  const o=LV[id]||(LV[id]={n:0,d:null,busy:false,pend:null,taps:0}),cur=lvEff(base);
  const d={gf:+cur.gf||0,ga:+cur.ga||0,played:!!cur.played,stats:JSON.parse(JSON.stringify(cur.stats||{})),events:[...(cur.events||[])]};
  fn(d,cur);o.d=d;o.n++;o.pend=d;o.taps++;
  rq();setTimeout(()=>badgeCheer(bb,badgeKeys(base.tid)),0); // il controllo traguardi dopo il disegno, così il tocco risponde subito
  lvPump(id)}
// Un solo salvataggio alla volta: se nel frattempo arrivano altri tocchi, parte un unico salvataggio con lo stato aggiornato.
function lvPump(id){
  const o=LV[id];if(!o||o.busy||!o.pend)return;
  const d=o.pend,k=o.taps;o.pend=null;o.taps=0;o.busy=true;
  S.db.doc('matches/'+id).update(d).then(()=>{const m=S.matches.find(m=>m.id===id);if(m){const {clock,...rest}=d;Object.assign(m,rest)}})
    .catch(e=>{S.err='Evento non salvato'+(e&&(e.code||e.message)?' ('+(e.code||e.message)+')':'')+': controlla la connessione.'})
    .finally(()=>{o.busy=false;o.n=Math.max(0,o.n-k);if(o.pend)lvPump(id);else{if(o.n===0)o.d=null;rq()}})}
// Cronometro: l'effetto è immediato sullo schermo (con l'ora del tocco); il salvataggio segue in coda con gli altri eventi.
function lvClockSet(id,c){
  const x=S.matches.find(m=>m.id===id);if(!x)return;
  const o=LV[id]||(LV[id]={n:0,d:null,busy:false,pend:null,taps:0});
  x.clock=c;o.n++;o.taps++;o.pend=Object.assign(o.pend||{},{clock:c});rq();lvPump(id)}
function liveSel(p){LIVE.p=LIVE.p===p?null:p;LIVE.assist=false;LIVE.pick=null;rq()}
function liveGoal(id){const p=LIVE.p;if(!p)return;try{navigator.vibrate&&navigator.vibrate(45)}catch(e){}try{confetti()}catch(e){}lvApply(id,d=>{lvStat(d,p).g++;d.gf++;d.events.push({k:'g',p,t:lvNow(),...lvM(id)})});LIVE.assist=true;rq()}
function liveAssist(id,a){
  if(a)lvApply(id,d=>{const e=d.events[d.events.length-1];if(e&&e.k==='g'&&!e.a){e.a=a;lvStat(d,a).a++}});
  LIVE.p=null;LIVE.assist=false;rq()}
function liveOpp(id){const base=S.matches.find(m=>m.id===id);if(!base)return;const ks=lvKeepers(lvEff(base));LIVE.p=null;LIVE.assist=false;LIVE.pick='opp';
  if(ks.length>1){rq();return}liveGk(id,ks[0]||null)}
function liveOwn(id){const p=LIVE.p;if(!p)return;const base=S.matches.find(m=>m.id===id);if(!base)return;const ks=lvKeepers(lvEff(base));LIVE.pick='og';
  if(ks.length>1){rq();return}liveGk(id,ks[0]||null)}
function liveGk(id,gk){const k=LIVE.pick,p=LIVE.p;LIVE.pick=null;
  if(k==='opp')lvApply(id,d=>{d.ga++;if(gk)lvStat(d,gk).gs++;d.events.push({k:'opp',gk:gk||null,t:lvNow(),...lvM(id)})});
  else if(k==='og'&&p)lvApply(id,d=>{lvStat(d,p).og++;d.ga++;if(gk)lvStat(d,gk).gs++;d.events.push({k:'og',p,gk:gk||null,t:lvNow(),...lvM(id)})});
  else if(k==='ps')lvApply(id,d=>{if(gk){const s=lvStat(d,gk);s.ps=(+s.ps||0)+1}d.events.push({k:'ps',gk:gk||null,t:lvNow(),...lvM(id)})});
  LIVE.p=null;rq()}
function liveSave(id){const base=S.matches.find(m=>m.id===id);if(!base)return;const ks=lvKeepers(lvEff(base));LIVE.p=null;LIVE.assist=false;LIVE.pick='ps';
  if(ks.length>1){rq();return}liveGk(id,ks[0]||null)}
function liveGkCancel(){LIVE.pick=null;rq()}
function liveCard(id,k){const p=LIVE.p;if(!p)return;lvApply(id,d=>{lvStat(d,p)[k]++;d.events.push({k,p,t:lvNow(),...lvM(id)})});LIVE.p=null;rq()}
function liveUndo(id){lvApply(id,d=>{const e=d.events.pop();if(!e)return;
  if(e.k==='g'){lvDec(d.stats[e.p],'g');d.gf=Math.max(0,d.gf-1);if(e.a)lvDec(d.stats[e.a],'a')}
  else if(e.k==='opp'){d.ga=Math.max(0,d.ga-1);if(e.gk)lvDec(d.stats[e.gk],'gs')}
  else if(e.k==='og'){lvDec(d.stats[e.p],'og');d.ga=Math.max(0,d.ga-1);if(e.gk)lvDec(d.stats[e.gk],'gs')}
  else if(e.k==='ps'){if(e.gk)lvDec(d.stats[e.gk],'ps')}
  else lvDec(d.stats[e.p],e.k)});LIVE.p=null;LIVE.assist=false;rq()}
function liveEnd(id){ask({title:'Fine partita?',msg:'La partita viene segnata come giocata con il risultato attuale.',ok:'Fine partita',fn:()=>{lvApply(id,d=>{d.played=true});liveClockStop(id)}})}
function liveLog(x){
  const nm=id=>esc(S.members.find(m=>m.id===id)?.nick||'?'),ev=x.events||[];
  if(!ev.length)return '';
  // Cronaca a due colonne: a sinistra la nostra squadra, a destra l'avversario (gol avversari e autogol), minuto al centro.
  const T=S.teams.find(t=>t.id===x.tid)||{},mine=e=>e.k!=='opp'&&e.k!=='og';
  // Riga con icona + testo che può andare a capo: i nomi lunghi si leggono per intero invece di essere tagliati.
  const ln=(i,t,c)=>'<div class="lvn'+(c?' '+c:'')+'">'+i+'<span>'+t+'</span></div>';
  const txt=e=>e.k==='g'?ln(ic('ball'),'<b>'+nm(e.p)+'</b>')+(e.a?ln(ic('assist'),nm(e.a),'as'):'')
    :e.k==='opp'?ln(ic('ball'),'<b>Gol</b>')
    :e.k==='og'?ln(ic('og'),'<b>Autogol</b>')+ln('',nm(e.p),'as')
    :e.k==='ps'?ln(ic('glove'),'<b>Rigore parato</b>')+(e.gk?ln('',nm(e.gk),'as'):'')
    :ln(e.k==='y'?ic('card','y'):ic('card','r'),'<b>'+nm(e.p)+'</b>');
  const row=e=>'<li class="lve"><div class="lvc l">'+(mine(e)?txt(e):'')+'</div><span class="lvm">'+(e.m?e.m+"'":'•')+'</span><div class="lvc r">'+(mine(e)?'':txt(e))+'</div></li>';
  return '<div class="lvt"><div class="lvc l">'+esc(T.name||'Noi')+'</div><span class="lvm"></span><div class="lvc r">'+esc(x.opp||'Avversari')+'</div></div><ol class="lvlog">'+ev.map(row).reverse().join('')+'</ol>'}
function liveCardHtml(x){
  const ps=(x.present||[]).map(i=>S.members.find(m=>m.id===i)).filter(m=>m&&m.role==='giocatore'),id=x.id;
  if(!ps.length)return '<div class="card"><b class="hd">Gol in diretta</b><p class="mu">Segna prima le presenze (scheda Info) e premi Salva: poi potrai registrare i gol con un tocco.</p></div>';
  const sel=LIVE.p&&ps.find(m=>m.id===LIVE.p),chips=ps.map(m=>`<button class="chip${m.id===LIVE.p?' on':''}" onclick="liveSel('${m.id}')">${m.num?'<i>'+esc(m.num)+'</i>':''}${esc(m.nick)}</button>`).join('');
  let bar='<p class="mu" style="margin:8px 0 0">Tocca un giocatore: gol, cartellino o autogol.</p>';
  if(LIVE.pick){const ks=lvKeepers(x);bar=`<div class="lvbar"><b>${LIVE.pick==='og'?'Autogol: chi era in porta?':LIVE.pick==='ps'?'Rigore parato: chi era in porta?':'Gol avversario: chi era in porta?'}</b><div class="chips">${ks.map(i=>`<button class="chip" onclick="liveGk('${id}','${i}')">${esc(S.members.find(m=>m.id===i)?.nick||'?')}</button>`).join('')}<button class="chip" onclick="liveGk('${id}',null)">Nessuno</button><button class="chip" onclick="liveGkCancel()">Annulla</button></div></div>`}
  else if(sel&&LIVE.assist)bar=`<div class="lvbar"><b>Gol di ${esc(sel.nick)}! Assist?</b><div class="chips">${ps.filter(m=>m.id!==sel.id).map(m=>`<button class="chip" onclick="liveAssist('${id}','${m.id}')">${esc(m.nick)}</button>`).join('')}<button class="chip" onclick="liveAssist('${id}',null)">Nessuno</button></div></div>`;
  else if(sel)bar=`<div class="lvbar"><b>${esc(sel.nick)}</b><div class="row"><button class="p" onclick="liveGoal('${id}')">${ic('ball')} Gol</button><button onclick="liveCard('${id}','y')" aria-label="Giallo">${ic('card','y')}</button><button onclick="liveCard('${id}','r')" aria-label="Rosso">${ic('card','r')}</button><button onclick="liveOwn('${id}')">${ic('og')} Autogol</button></div></div>`;
  const cl=x.clock||{},clk=`<div class="lvclk"><b id="lvclock" data-id="${id}">${lvFmt(lvElapsed(x))}</b><button class="s" onclick="liveClock('${id}')">${cl.since?'Pausa':(+cl.base?'Riprendi':'Avvia')}</button>${cl.since||+cl.base?`<button class="s" onclick="liveClockReset('${id}')">Azzera</button>`:''}</div>`;const sc=x.gf+'-'+x.ga;if(LIVE.sc!==undefined&&LIVE.sc!==sc)LIVE.popAt=lvNow();LIVE.sc=sc;const pop=lvNow()-(LIVE.popAt||0)<900?' pop':'';
  return `<div class="card live"><div class="lvh"><b class="hd">${ic('ball')} Gol in diretta</b><span class="lvs${pop}">${esc(x.gf)} – ${esc(x.ga)}</span></div>${clk}<div class="chips">${chips}</div>${bar}<div class="row" style="margin-top:10px"><button onclick="liveOpp('${id}')">${ic('plus')} Gol avversario</button><button onclick="liveSave('${id}')">${ic('glove')} Rigore parato</button></div><p style="margin:8px 0 0"><button style="width:100%" onclick="liveUndo('${id}')">${ic('undo')} Annulla ultimo</button></p>${x.played?'':`<p style="margin:10px 0 0"><button class="p" onclick="liveEnd('${id}')">Fine partita</button></p>`}<p class="mu" style="margin:8px 0 0">Ogni tocco si salva subito, non serve premere Salva.</p>${liveLog(x)}</div>`}

// Cronometro: salvato nella partita (clock:{base,since}), così lo vedono tutti e il minuto finisce nella cronaca.
// Ora del server: ogni telefono corregge il proprio orologio, così il cronometro è uguale per tutti.
let LVOFF=0,LVAT=0;const lvNow=()=>Date.now()+LVOFF;
async function lvSync(){try{let best=null;for(let i=0;i<3;i++){const t0=Date.now(),r=await sb.rpc('server_time'),t1=Date.now(),s=Number(r&&r.data);
  if(!r||r.error||!isFinite(s)||s<1e12)return;const rtt=t1-t0;if(!best||rtt<best.rtt)best={rtt,off:s+rtt/2-t1}}
  if(best){LVOFF=Math.abs(best.off)<120?0:Math.round(best.off);LVAT=Date.now()}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&LVAT&&Date.now()-LVAT>600000)lvSync()});
const lvElapsed=x=>{const c=x&&x.clock;return c?(+c.base||0)+(c.since?lvNow()-c.since:0):0};
const lvFmt=ms=>{const t=Math.floor(ms/1000);return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')};
const lvM=id=>{const x=S.matches.find(m=>m.id===id);return x&&x.clock?{m:Math.floor(lvElapsed(x)/60000)+1}:{}};
function liveClock(id){const x=S.matches.find(m=>m.id===id),c=(x&&x.clock)||{base:0,since:null},now=lvNow();
  lvClockSet(id,c.since?{base:(+c.base||0)+now-c.since,since:null}:{base:+c.base||0,since:now})}
function liveClockStop(id){const x=S.matches.find(m=>m.id===id);if(x&&x.clock&&x.clock.since)lvClockSet(id,{base:lvElapsed(x),since:null})}
function liveClockReset(id){ask({title:'Azzerare il cronometro?',msg:'Riparte da 00:00. I minuti già scritti nella cronaca restano.',ok:'Azzera',danger:1,fn:()=>lvClockSet(id,{base:0,since:null})})}
(function tick(){let d=500;const e=document.getElementById('lvclock');if(!document.hidden&&e&&S.matches){const x=S.matches.find(m=>m.id===e.dataset.id),el=lvElapsed(x);e.textContent=lvFmt(el);if(x&&x.clock&&x.clock.since)d=1000-(el%1000)+20}setTimeout(tick,d)})();

// ===== Selettore colore con cursore, uguale su iOS e Android =====
// Il <input type="color"> lo disegna il sistema (iOS e Android lo mostrano in modo diverso): qui lo sostituiamo con uno nostro.
(function(){
  const st=document.createElement('style');st.textContent='.cpk{margin:10px 0;padding:12px;border:1px solid var(--bd);border-radius:14px;background:var(--bg)}.cpk-sv,.cpk-h{position:relative;touch-action:none;border-radius:10px;cursor:pointer}.cpk-sv{height:170px}.cpk-h{height:26px;margin-top:12px;background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}.cpk i{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1.5px #0007,0 2px 6px #0006;pointer-events:none}.cpk-h i{top:50%}.cpk-row{display:flex;gap:8px;margin-top:12px}.cpk-hex{flex:1;font-family:monospace}.cpk-sw,.cpk-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.cpk-c{width:38px;height:38px;border-radius:50%;padding:0;border:2px solid var(--bd)}.cpk-cv{display:none;width:100%;margin-top:12px;border-radius:10px}';document.head.append(st);
  const hsv2hex=(h,s,v)=>{const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return '#'+[f(5),f(3),f(1)].map(c=>Math.round(c*255).toString(16).padStart(2,'0')).join('')};
  const hex2hsv=hex=>{const n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return [h,mx?d/mx:0,mx]};
  // Colori principali del logo della squadra, da toccare per sceglierli.
  function logoColors(src){return new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';im.onerror=()=>res([]);im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.drawImage(im,0,0,64,64);const d=g.getImageData(0,0,64,64).data,m={};
    for(let i=0;i<d.length;i+=4){if(d[i+3]<200)continue;const k=(d[i]>>4)+','+(d[i+1]>>4)+','+(d[i+2]>>4),o=m[k]||(m[k]={n:0,r:0,g:0,b:0});o.n++;o.r+=d[i];o.g+=d[i+1];o.b+=d[i+2]}
    const arr=Object.values(m).sort((a,b)=>b.n-a.n).map(o=>[o.r/o.n,o.g/o.n,o.b/o.n]),out=[];for(const c of arr){if(out.every(q=>Math.hypot(q[0]-c[0],q[1]-c[1],q[2]-c[2])>60))out.push(c);if(out.length>=7)break}
    res(out.map(c=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')))}catch{res([])}};im.src=src})}
  let closeActive=null;
  function openPicker(input){
    if(closeActive)closeActive();const host=input.closest('fieldset')||input.parentElement,start=input.value;
    let [h,s,v]=hex2hsv(/^#[0-9a-f]{6}$/i.test(input.value)?input.value:'#f5c518');
    const el=document.createElement('div');el.className='cpk';
    el.innerHTML='<div class="cpk-sv"><i></i></div><div class="cpk-h"><i></i></div><div class="cpk-sw"></div><div class="cpk-btns"><button type="button" class="s cpk-img">Preleva da immagine</button></div><canvas class="cpk-cv"></canvas><input type="file" accept="image/*" style="display:none"><div class="cpk-row"><input class="cpk-hex" maxlength="7" aria-label="Codice colore"><button type="button" class="p s cpk-done">Fatto</button></div>';
    host.after(el);
    const outside=e=>{if(!el.contains(e.target)&&!(e.target.closest&&e.target.closest('input[type=color]')))close()};
    const close=()=>{document.removeEventListener('click',outside,true);el.remove();closeActive=null;if(input.value!==start)input.dispatchEvent(new Event('change',{bubbles:true}))};
    closeActive=close;setTimeout(()=>document.addEventListener('click',outside,true),0);
    const sv=el.querySelector('.cpk-sv'),hu=el.querySelector('.cpk-h'),hex=el.querySelector('.cpk-hex');
    const paint=(emit=true)=>{const c=hsv2hex(h,s,v);sv.style.background='linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl('+h+' 100% 50%))';sv.firstChild.style.cssText='left:'+s*100+'%;top:'+(1-v)*100+'%;background:'+c;hu.firstChild.style.left=h/360*100+'%';hu.firstChild.style.background='hsl('+h+' 100% 50%)';hex.value=c;if(emit){input.value=c;input.dispatchEvent(new Event('input',{bubbles:true}))}};
    const drag=(box,fn)=>box.addEventListener('pointerdown',e=>{box.setPointerCapture(e.pointerId);const mv=e=>{const r=box.getBoundingClientRect();fn(Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height)));paint()};mv(e);box.onpointermove=mv;box.onpointerup=box.onpointercancel=()=>{box.onpointermove=null}});
    drag(sv,(x,y)=>{s=x;v=1-y});drag(hu,x=>{h=x*359.99});
    hex.oninput=()=>{if(/^#[0-9a-f]{6}$/i.test(hex.value)){[h,s,v]=hex2hsv(hex.value);paint()}};
    const setHex=c=>{[h,s,v]=hex2hsv(c);paint()};
    el.querySelector('.cpk-done').onclick=close;
    const logo=(window.S&&S.teams||[]).find(t=>t.id===S.tid)?.logo;
    if(logo)logoColors(logo).then(cols=>{const box=el.querySelector('.cpk-sw');cols.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='cpk-c';b.style.background=c;b.setAttribute('aria-label',c);b.onclick=()=>setHex(c);box.append(b)})});
    // Prelievo da una foto o da uno screenshot: si sceglie l'immagine e si tocca il punto di cui si vuole il colore.
    const file=el.querySelector('input[type=file]'),cv=el.querySelector('.cpk-cv');el.querySelector('.cpk-img').onclick=()=>file.click();
    file.onchange=()=>{const f=file.files[0];if(!f)return;const im=new Image(),u=URL.createObjectURL(f);im.onload=()=>{const w=Math.min(im.width,600);cv.width=w;cv.height=Math.round(im.height*w/im.width);cv.getContext('2d',{willReadFrequently:true}).drawImage(im,0,0,cv.width,cv.height);cv.style.display='block';URL.revokeObjectURL(u)};im.src=u};
    const pick=e=>{const r=cv.getBoundingClientRect(),x=Math.min(cv.width-1,Math.max(0,Math.floor((e.clientX-r.left)/r.width*cv.width))),y=Math.min(cv.height-1,Math.max(0,Math.floor((e.clientY-r.top)/r.height*cv.height))),d=cv.getContext('2d').getImageData(x,y,1,1).data;setHex('#'+[d[0],d[1],d[2]].map(n=>n.toString(16).padStart(2,'0')).join(''))};
    cv.style.touchAction='none';cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);pick(e);cv.onpointermove=pick};cv.onpointerup=cv.onpointercancel=()=>{cv.onpointermove=null};
    if(window.EyeDropper){const b=document.createElement('button');b.type='button';b.className='s';b.textContent='Contagocce';b.onclick=()=>new EyeDropper().open().then(r=>setHex(r.sRGBHex)).catch(()=>{});el.querySelector('.cpk-btns').append(b)}
    paint(false);
  }
  document.addEventListener('click',e=>{const i=e.target.closest&&e.target.closest('input[type=color]');if(i){e.preventDefault();openPicker(i)}},true);
})();

// ===== Stile delle immagini salvato nel profilo della squadra =====
// Due gruppi separati: risultato (accento, sfondo, testo) e formazione (anche maglia, numero, portiere).
function teamShareStyle(team,kind){const t=(team&&team.shareStyle)||{},res=kind==='result',p=(res?t.resultPalette:t.formationPalette),pal=p&&Object.keys(p).length?p:(t.palette&&Object.keys(t.palette).length?t.palette:null);return {layout:res?t.resultLayout:t.formationLayout,palette:pal}}
function shareDefaults(team){const a=/^#[0-9a-f]{6}$/i.test((team&&team.color)||'')?team.color:'#f5c518';return formationDefaults(team||{},{accent:a,background:'#101216',text:'#f5f4ed'})}
function setShareStyle(patch){const t=S.teams.find(x=>x.id===S.tid)||{},cur=t.shareStyle||{},m=k=>({...(cur[k]||cur.palette||{}),...(patch[k]||{})});S.db.doc('teams/'+S.tid).update({shareStyle:{...cur,...patch,palette:{},resultPalette:m('resultPalette'),formationPalette:m('formationPalette')}})}
function resetShareColors(k){const t=S.teams.find(x=>x.id===S.tid)||{},cur=t.shareStyle||{},o=k==='resultPalette'?'formationPalette':'resultPalette';S.db.doc('teams/'+S.tid).update({shareStyle:{...cur,palette:{},[o]:cur[o]||cur.palette||{},[k]:{}}})}
function shareStyleCard(t){
  const s=t.shareStyle||{},def=shareDefaults(t),seg=(key,cur)=>'<div class="seg">'+RESULT_LAYOUTS.map(([k,n])=>`<button type="button" class="${(cur||'campo')===k?'on':''}" onclick="setShareStyle({${key}:'${k}'})">${n}</button>`).join('')+'</div>';
  const colors=(pk,keys)=>{const pal={...def,...(s[pk]&&Object.keys(s[pk]).length?s[pk]:(s.palette||{}))};return `<fieldset class="report-colors" style="flex-wrap:wrap"><legend>Colori</legend>${keys.map(([k,l])=>`<label style="flex:1 1 30%">${l}<input type="color" value="${pal[k]}" onchange="setShareStyle({${pk}:{${k}:this.value}})"></label>`).join('')}</fieldset><button class="s" onclick="resetShareColors('${pk}')">Usa i colori della squadra</button>`};
  return `<div class="card"><b>Immagine del risultato</b><p class="mu">Stile e colori usati in automatico per “Condividi risultato” di tutte le partite. Nella singola immagine puoi comunque fare ritocchi, che valgono solo per quella.</p><label>Stile</label>${seg('resultLayout',s.resultLayout)}${colors('resultPalette',FORMATION_COLORS.slice(0,3))}</div>
  <div class="card"><b>Immagine della formazione</b><p class="mu">Stile e colori usati in automatico per “Condividi formazione”, maglie comprese.</p><label>Stile</label>${seg('formationLayout',s.formationLayout)}${colors('formationPalette',FORMATION_COLORS)}</div>`;
}

// Schermo sempre acceso mentre è aperta la scheda "In diretta".
let _wl=null,_wlBusy=false;
async function wakeSync(){
  if(_wlBusy)return;_wlBusy=true;
  try{const p=document.querySelector('.mp[data-k="live"]'),want=!document.hidden&&!!p&&p.style.display!=='none'&&!!p.querySelector('.card.live');
    if(want&&!_wl&&navigator.wakeLock){_wl=await navigator.wakeLock.request('screen');_wl.addEventListener('release',()=>{_wl=null})}
    else if(!want&&_wl){const w=_wl;_wl=null;await w.release()}}catch(e){_wl=null}
  _wlBusy=false}
setInterval(wakeSync,2500);document.addEventListener('visibilitychange',wakeSync);
