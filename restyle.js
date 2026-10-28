// ===== Restyle: palette unica, schermata "Oggi", rifiniture =====
(function(){const st=document.createElement('style');st.textContent=`
:root{--bg:#f3f5f9;--sf:#fff;--bd:#e6eaf1;--ac:#0b7a43;--acf:#0b7a43;--ac2:#e3f3ea;--on:#fff}
:root:root:root{--bg:#0a0e15;--sf:#131a27;--bd:#202a3b;--ac:#2fd17a;--acf:#2fd17a;--ac2:#12281d;--on:#04210f}
.card{border-radius:18px;box-shadow:0 1px 2px rgba(15,23,42,.06),0 6px 18px -10px rgba(15,23,42,.18)}
:root:root:root .card{box-shadow:0 1px 0 rgba(255,255,255,.03) inset,0 8px 20px -12px rgba(0,0,0,.6)}
.bar{border-bottom-color:transparent;box-shadow:0 1px 0 var(--bd)}
.bn{border-top-color:transparent;box-shadow:0 -1px 0 var(--bd)}
.bn button.on{color:var(--ac)}.bn .on::before{left:30%;right:30%;height:3px;border-radius:0 0 4px 4px}
.bn button .ic{width:24px;height:24px}
.add .card{box-shadow:none;border:0;padding:0;background:none;margin:12px 0 0}
.add .card h2{font-size:16px}
`;document.head.append(st)})();
