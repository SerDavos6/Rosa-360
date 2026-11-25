// ===== Look «Matchday» =====
// Caricato per ultimo: ridisegna l'aspetto senza toccare la logica.
// Colori di base (sfondo, superfici, testo) li imposta applyMode/applyTheme in index.html;
// qui ci sono caratteri, forme e il giallo "--hl" per le azioni importanti (diretta, MVP, Modifica).
(function(){const st=document.createElement('style');st.id='matchday';st.textContent=`
:root{--num:"Barlow Condensed",Oswald,"Arial Narrow",sans-serif;--hl:#f5b81c;--hlx:#14171f;--r:18px;
 --win:#0f5132;--draw:#9aa0ab;--loss:#c2410c}
:root:root:root{--hl:#f5b81c}
html[style*="color-scheme: dark"]{--win:#2fbf71;--draw:#6b7280;--loss:#f0703e}

/* titoli: condensati, maiuscoli, da tabellone */
h1{font:800 34px/1 var(--num);text-transform:uppercase;letter-spacing:.01em;margin:6px 0 14px}
h2{font:700 19px/1.1 var(--num);letter-spacing:.03em;text-transform:uppercase;color:var(--tx);margin:22px 2px 10px}
.tool h2{margin:0}
.eb{font:700 12px/1.2 var(--ui);letter-spacing:.08em}
.bar .tn{font:700 22px/1.05 var(--num);text-transform:uppercase;letter-spacing:.02em}
.logo0 h1{font-size:40px}

/* schede: piatte, bordo sottile, angoli morbidi */
.card,.hero2{border-radius:18px;box-shadow:none}
:root:root:root .card{box-shadow:none}
.bar{box-shadow:0 1px 0 var(--bd)}

/* barra in basso: pillola dietro l'icona della scheda attiva */
.bn{box-shadow:0 -1px 0 var(--bd)}
.bn button{font-size:11px;font-weight:600;gap:4px}
.bn .on::before{display:none}
.bn button>span{width:56px;height:30px;border-radius:999px;display:grid;place-items:center;transition:background .15s}
.bn button.on>span{background:color-mix(in srgb,var(--acf) 16%,transparent)}
.bn button .ic{width:22px;height:22px}
.dot{top:4px;left:calc(50% + 12px)}

/* pulsanti */
button{border-radius:14px}
button.p{font-weight:800}
.ib{border-radius:12px}

/* selettore a segmenti: pista grigia, voce scelta in bianco */
.seg{background:color-mix(in srgb,var(--tx) 8%,var(--bg))}
.seg .on{background:var(--sf);color:var(--ac);box-shadow:0 1px 3px rgba(20,23,31,.16)}
.mtabs .on{color:var(--ac)}

/* pillole: quella scelta in inchiostro */
.chip.on{background:var(--tx);color:var(--bg)}

/* interruttore Modifica e banda gialla */
.ib.edt.on{background:var(--hl);border-color:var(--hl);color:var(--hlx)}
.edband{background:color-mix(in srgb,var(--hl) 22%,var(--sf));color:var(--tx)}
.edband .s{background:var(--sf);color:var(--tx);border-color:var(--hl)}

/* ---- Home: prossima partita ---- */
.nxt{background:var(--acf);box-shadow:none}
.nxt::after{right:-70px;top:-70px;width:210px;height:210px;background:none;border:3px solid color-mix(in srgb,var(--on) 15%,transparent)}
.rn-hero{border-radius:24px}
.rn-pill{font-size:11px;letter-spacing:.06em;text-transform:uppercase}
.rn-x{font:800 34px/1 var(--num);opacity:.9}
.rn-lg{font:800 20px var(--num)}
.rn-go{border-radius:14px;font-weight:800}
.rn-two .rn-go{background:transparent;color:var(--on);border:1.5px solid color-mix(in srgb,var(--on) 55%,transparent)}
.rn-two .rn-go.on{background:color-mix(in srgb,var(--on) 18%,transparent)}
.rn-go[onclick*="liveStart"],.rn-two .rn-go[onclick*="liveStart"]{background:var(--hl);color:var(--hlx);border:0}

/* ultime partite: esito in quadratini V/N/P */
.rb,.hrow .rb{color:#fff;border-radius:7px}
.rb.v,.fm.v{background:var(--win)}.rb.n,.fm.n{background:var(--draw)}.rb.p,.fm.p{background:var(--loss)}
.hrow .hs{font:800 24px/1 var(--num)}
.mrow{border-left-width:4px}
.mrow.w{border-left-color:var(--win)}.mrow.l{border-left-color:var(--loss)}.mrow.d{border-left-color:var(--draw)}
.mrow .hd,.hrow .hm b{font-weight:700}
.db{border-radius:10px;background:color-mix(in srgb,var(--tx) 6%,var(--sf));color:var(--mu)}
.db b{font:800 22px/1 var(--num);color:var(--tx)}
.rs .hd{font:800 26px/1 var(--num)}
.big b{font:800 60px/1 var(--num);color:var(--tx)}

/* ---- rosa: carte giocatore ---- */
.grid{gap:10px}
.fut{border-radius:20px;border-width:1px;padding:12px 10px 14px}
.fut .ov{font:800 40px/1 var(--num)}
.fut .nk{font:700 17px/1.1 var(--num);letter-spacing:.03em}
.fut .st b{font:800 18px var(--num)}
.fut.t-g,.fut.t-x{border-color:var(--hl)}
.pl .o{font:800 26px var(--num)}
.pl .n{font:700 19px var(--num)}

/* ---- classifiche, tessere, podio ---- */
.tl{background:var(--sf);border:1px solid var(--bd);border-radius:14px;font-size:10.5px;font-weight:700;letter-spacing:.04em}
.tl b{font:800 26px/1.05 var(--num)}
.stt b{font:800 26px/1 var(--num)}
.pod .p1 .crest{border-color:var(--hl)}
.pod .st2{border-radius:14px 14px 0 0;background:color-mix(in srgb,var(--acf) 14%,var(--sf))}
.pod .p3 .st2{background:color-mix(in srgb,var(--tx) 7%,var(--sf))}
.pod .pl2,.pod .pv{font-family:var(--num);font-weight:800}
.lr .rk{font:700 17px var(--num)}

/* ---- torneo ---- */
.trt th{font-size:11px;letter-spacing:.04em;color:var(--mu)}
.tbx{border-radius:14px}
.tbt{letter-spacing:.06em}

/* ---- pannelli e finestre ---- */
.pm,dialog{border-radius:24px 24px 0 0}
dialog{border-radius:24px}
.toast{border-radius:14px}
`;document.head.append(st)})();
(function(){const st=document.createElement('style');st.textContent=`
.fmx{color:#fff;border-radius:12px}.fmx b{font:800 20px/1.05 var(--num)}
i[style*="--win"] b,i[style*="--draw"] b,i[style*="--loss"] b{color:#fff}
.fmx.v{background:var(--win)}.fmx.n{background:var(--draw)}.fmx.p{background:var(--loss)}
`;document.head.append(st)})();
// ---- struttura come nel rendering ----
(function(){const st=document.createElement('style');st.textContent=`
/* intestazione: interruttore Modifica a pillola */
.edpill{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:4px 6px 4px 12px;border-radius:999px;border:1px solid var(--bd);background:var(--sf);color:var(--tx);font:700 13px var(--ui)}
.edpill i{position:relative;width:34px;height:20px;border-radius:999px;background:color-mix(in srgb,var(--tx) 18%,transparent);transition:background .15s}
.edpill i::after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .15s}
.edpill.on i{background:var(--hl)}.edpill.on i::after{left:16px}
@media (max-width:380px){.edpill{font-size:0;gap:0;padding:4px 6px}}
.bar .ssn{min-height:26px;padding:0 6px;border:0;background:none;color:var(--mu);font:600 12px var(--ui)}

/* prossima partita */
.rn2 .rn-top{justify-content:flex-start;gap:8px}
.rn-when{flex:none;padding:3px 9px;border-radius:7px;background:var(--on);color:var(--acf);font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.rn-sub{min-width:0;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rn2 .rn-vs{margin:16px 0 12px}
.rn-mid{flex:0 0 auto!important;gap:2px!important}
.rn-time{font:800 46px/1 var(--num);letter-spacing:.01em}
.rn-place{font-size:12px;opacity:.85;white-space:nowrap}
.rn-conf{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 10px;border-radius:14px;background:rgba(0,0,0,.18)}
.rn-faces{display:flex;flex:none}
.rn-faces>*{width:28px;height:28px;border-radius:50%;border:2px solid var(--acf);margin-left:-8px;object-fit:cover;display:grid;place-items:center;background:color-mix(in srgb,var(--on) 85%,var(--acf));color:var(--acf);font:800 11px var(--ui)}
.rn-faces>:first-child{margin-left:0}.rn-faces .more{background:var(--on)}
.rn-cn{flex:1;min-width:0;font-size:13px}
.rn2 .rn-cal{width:36px;min-height:36px;padding:0;justify-content:center}.rn2 .rn-cal .ic{width:17px;height:17px}
.rn2 .rn-go{margin-top:12px;min-height:48px}
.rn2 .rn-two .rn-go{margin-top:12px}

/* ultime partite: forma e unica scheda a righe */
.fmq{display:flex;gap:4px}.fmq .rb{width:22px;height:22px;margin:0;border-radius:6px;font-size:11px}
.mlist{padding:0;overflow:hidden}
.mlist .mrow{border-left:0;border-radius:0;padding:11px 14px;gap:12px;margin:0}
.mlist .mrow+.mrow{border-top:1px solid var(--bd)}
.mlist .db{width:40px;padding:0;background:none;font-size:10px}
.mlist .db b{font-size:21px}
.mlist .crest.sm{width:36px;height:36px;border-radius:50%;background:color-mix(in srgb,var(--tx) 6%,var(--sf));border:0;font-size:16px}
.mlist .mrow .hd{font:600 15px/1.2 var(--ui)}
.mlist .mrow .mid .mu{font-size:12px}
.mlist .gold{font-size:12px;margin-top:2px}
.rs .sp{display:inline-block;font:800 22px/1 var(--num);padding:4px 9px;border-radius:8px}
.sp.v{background:color-mix(in srgb,var(--win) 15%,var(--sf));color:var(--win)}
.sp.n{background:color-mix(in srgb,var(--tx) 8%,var(--sf));color:var(--tx)}
.sp.p{background:color-mix(in srgb,var(--loss) 15%,var(--sf));color:var(--loss)}

/* carta giocatore chiara */
.fut.f2{text-align:left;background:var(--sf);color:var(--tx);border:1px solid var(--bd);border-radius:18px;padding:12px}
.f2 .f2t{display:flex;justify-content:space-between;align-items:flex-start;gap:6px}
.f2 .ov{position:static;font:800 40px/.9 var(--num);color:var(--tx)}
.f2 .ps{position:static;margin-top:2px;font-size:11px;font-weight:800;letter-spacing:.08em;opacity:1;color:var(--mu)}
.f2 .ph{width:50px;height:50px;margin:0;border:0;font:800 18px var(--ui);background:color-mix(in srgb,var(--acf) 18%,var(--sf));color:var(--ac)}
.f2.t-g .ph,.f2.t-x .ph{box-shadow:0 0 0 3px var(--hl)}
.f2 .nk{margin-top:12px;border:0;padding:0;text-transform:none;font:700 16px/1.15 var(--ui);letter-spacing:0;display:flex;align-items:baseline;gap:6px}
.f2 .nk span{font:700 16px var(--num);color:var(--mu)}
.f2 .st{margin-top:10px;padding-top:8px;border-top:1px solid var(--bd);text-align:center;font-size:10px;font-weight:700;color:var(--mu)}
.f2 .st b{color:var(--tx);font:800 19px/1 var(--num)}
.f2.t-g,.f2.t-x{border-color:var(--bd)}
.f2.t-x{background:var(--acf);color:var(--on);border-color:var(--acf)}
.f2.t-x .ov,.f2.t-x .st b{color:var(--on)}.f2.t-x .ps,.f2.t-x .nk span,.f2.t-x .st{color:color-mix(in srgb,var(--on) 75%,transparent)}
.f2.t-x .st{border-top-color:color-mix(in srgb,var(--on) 22%,transparent)}
.f2.t-x .ph{background:var(--hl);color:var(--hlx)}
.grid{grid-template-columns:repeat(2,minmax(0,1fr))}
@media (min-width:600px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}

/* scheda Io: fascia colorata */
.iotop{gap:8px}.iotop .s{flex:none}
.ioband{background:var(--acf);color:var(--on);border-radius:24px;padding:16px;margin:4px 0 14px}
.ioband-top{display:flex;align-items:center;gap:14px}
.ioav{flex:none;width:62px;height:62px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:var(--hl);color:var(--hlx);font:800 21px var(--ui)}
.ioav img{width:100%;height:100%;object-fit:cover}
.ioid{flex:1;min-width:0;display:flex;flex-direction:column}
.ioid span{font-size:12px;font-weight:700;letter-spacing:.06em;opacity:.85}
.ioid b{font:800 30px/1.02 var(--num);text-transform:uppercase;overflow-wrap:anywhere}
.ioov{flex:none;text-align:center}.ioov b{display:block;font:800 46px/.9 var(--num);color:var(--hl)}
.ioov span{font-size:10px;font-weight:800;letter-spacing:.08em;opacity:.85}
.ioband-nx{display:flex;align-items:center;gap:10px;margin-top:14px;padding:8px 8px 8px 14px;border-radius:14px;background:rgba(0,0,0,.2);font-size:13px}
.ioband-nx span{flex:1;min-width:0}
.ioband-nx button{flex:none;min-height:40px;padding:0 16px;border:0;border-radius:10px;background:var(--hl);color:var(--hlx);font-weight:800;font-size:14px}
.ioband-nx button.on{background:color-mix(in srgb,var(--on) 22%,transparent);color:var(--on)}

`;document.head.append(st)})();
