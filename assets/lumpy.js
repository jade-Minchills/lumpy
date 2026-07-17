/* ============================================================
   Lumpy - shell logic (store, hub, tool page, nav, motif)
   The store is plain localStorage, shared same-origin with the
   tool iframes, so data set in one module appears in the others.
   ============================================================ */
(function(){
'use strict';
const PKEY='lumpy_profile_v1', GKEY='lumpy_progress_v1';

/* ---- module metadata: single source of truth ---- */
const MODULES=[
  {n:1,slug:'income-smoothing',file:'tools/m1-income-smoothing.html',icon:'🌊',
   name:'Income Smoothing System',
   tag:'Turn an income that comes in waves into a steady monthly baseline you can live on.',
   uses:[], gives:'your smoothed monthly income'},
  {n:2,slug:'smart-spending',file:'tools/m2-smart-spending.html',icon:'🧭',
   name:'Smart Spending Framework',
   tag:'Three-tier rules that decide what you spend and what you pause in any month.',
   uses:['smoothed income'], gives:'your spending rules'},
  {n:3,slug:'stability',file:'tools/m3-stability.html',icon:'🛡️',
   name:'5-Year Stability Plan',
   tag:'Emergency fund, retirement annuity, and protection - mapped over five years.',
   uses:['smoothed income','essentials'], gives:'your Shield balance & RA value'},
  {n:4,slug:'credit',file:'tools/m4-credit.html',icon:'🏦',
   name:'Credit Readiness Strategy',
   tag:'Build the documentation pack that replaces a payslip when you apply for credit.',
   uses:['smoothed income','Shield balance'], gives:'your credit readiness score'},
  {n:5,slug:'tax',file:'tools/m5-tax.html',icon:'🧾',
   name:'Tax Management System',
   tag:'Provisional tax, SARS deadlines, and deductions - handled before they become a crisis.',
   uses:['income'], gives:'your tax provision plan'},
  {n:6,slug:'annual-planner',file:'tools/m6-annual-planner.html',icon:'📅',
   name:'Annual Financial Planner',
   tag:'The capstone: pulls all five modules into a 12-month plan with opening and closing balances for every account.',
   uses:['everything from 1-5'], gives:'your full year plan'},
];

/* ---- store ---- */
const Store={
  profile(){try{return JSON.parse(localStorage.getItem(PKEY))||{}}catch(e){return{}}},
  progress(){try{return JSON.parse(localStorage.getItem(GKEY))||{}}catch(e){return{}}},
  done(n){return !!this.progress()['m'+n]},
  reset(){
    localStorage.removeItem(PKEY);localStorage.removeItem(GKEY);localStorage.removeItem('lumpy_profile');
    for(let i=1;i<=6;i++){localStorage.removeItem('lumpy_tool_'+i+'_v1');localStorage.removeItem('lumpy_tool_'+i+'_v1_rows');localStorage.removeItem('lumpy_tool_'+i+'_v1_forecast');}
  }
};
const money=(v,cur)=>{
  if(v===null||v===undefined||v===''||isNaN(v))return null;
  return (cur||'R')+Math.round(v).toLocaleString();
};

/* ---- signature: irregular-income → smoothed-line SVG ---- */
function rhythmSVG(){
  const W=440,H=210,pad=8,base=H-26,n=12;
  // a believably lumpy 12-month pattern
  const vals=[34,58,6,72,28,4,52,14,68,40,0,46];
  const max=Math.max(...vals), gap=6, bw=(W-pad*2-gap*(n-1))/n;
  const smoothed=42; // the steady baseline line height (relative)
  let bars='',labels='';
  const mo=['J','F','M','A','M','J','J','A','S','O','N','D'];
  vals.forEach((v,i)=>{
    const h=Math.max(2,(v/max)*(base-30));
    const x=pad+i*(bw+gap), y=base-h;
    const low=v>0 && v<max*0.3;
    bars+=`<rect class="rbar${low?' low':''}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" style="animation-delay:${(i*55)}ms"/>`;
    labels+=`<text class="rlabel" x="${(x+bw/2).toFixed(1)}" y="${base+14}" text-anchor="middle">${mo[i]}</text>`;
  });
  const ly=base-(smoothed/max)*(base-30);
  const line=`M ${pad} ${ly.toFixed(1)} L ${(W-pad)} ${ly.toFixed(1)}`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Twelve months of irregular income resolving into one steady smoothed baseline">
    ${bars}${labels}
    <path class="rline" d="${line}"/>
    <circle class="rdot" cx="${W-pad}" cy="${ly.toFixed(1)}" r="5"/>
  </svg>`;
}
function mountRhythm(){
  const host=document.querySelector('[data-rhythm]');
  if(!host)return;
  host.innerHTML=`<div class="cap"><b>Your income, 12 months</b><span>R = smoothed baseline</span></div>
    ${rhythmSVG()}
    <div class="rlegend"><span><i style="background:rgba(255,255,255,.25)"></i>What you earn</span>
    <span><i style="background:var(--coral)"></i>What you pay yourself</span></div>`;
}

/* ---- nav toggle ---- */
function mountNav(){
  const t=document.querySelector('.nav-toggle');
  const links=document.querySelector('.nav-links');
  if(t&&links)t.addEventListener('click',()=>{
    const open=links.classList.toggle('open');
    t.setAttribute('aria-expanded',open);
  });
}

/* ---- hub: profile card + progress + roadmap ---- */
function renderHub(){
  const hub=document.getElementById('hub');
  if(!hub)return;
  const p=Store.profile(), cur=p.currency||'R';
  const completed=MODULES.filter(m=>Store.done(m.n)).length;

  /* profile card */
  const fields=[
    {l:'Smoothed income',v:money(p.income,cur),m:p.income?'/month':'',from:'Module 1'},
    {l:'Tax provision',v:p.taxRate?Math.round(p.taxRate)+'%':null,m:'',from:'Module 1'},
    {l:'Monthly essentials',v:money(p.tier1,cur),m:p.tier1?'/month':'',from:'Module 1/3'},
    {l:'Shield balance',v:money(p.shield,cur),m:'',from:'Module 3'},
    {l:'Retirement value',v:money(p.raValue,cur),m:'',from:'Module 3'},
    {l:'Currency',v:p.currency?p.currency:null,m:'',from:'Module 1'},
  ];
  const pf=fields.map(f=>`<div class="pf"><div class="pl">${f.l}</div>
    <div class="pv${f.v?'':' empty'}">${f.v?f.v:'-'}${f.v&&f.m?`<span style="font-size:12px;color:rgba(255,255,255,.4)"> ${f.m}</span>`:''}</div>
    <div class="pm">${f.v?'from '+f.from:'set in '+f.from}</div></div>`).join('');
  const C=2*Math.PI*32, off=C-(completed/MODULES.length)*C;
  const card=document.getElementById('profileCard');
  if(card)card.innerHTML=`
    <div class="ph">
      <div><h3>Your Lumpy profile</h3></div>
      <div class="prog"><div class="ring">
        <svg width="78" height="78"><circle cx="39" cy="39" r="32" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="6"/>
        <circle cx="39" cy="39" r="32" fill="none" stroke="var(--coral)" stroke-width="6" stroke-linecap="round"
          stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" style="transition:stroke-dashoffset 1s ease"/></svg>
        <div class="rt"><div class="rn" style="color:#fff">${completed}</div><div class="rl">of ${MODULES.length} done</div></div>
      </div></div>
    </div>
    <p class="sub">Set once, carried everywhere. Each value below flows automatically into the modules that need it - no re-typing between tools.</p>
    <div class="pf-grid">${pf}</div>`;

  /* roadmap */
  const road=document.getElementById('roadmap');
  if(road)road.innerHTML=MODULES.map(m=>{
    const done=Store.done(m.n);
    const cls=done?'done':'';
    const stat=done?'<span class="stat done">Done ✓</span>':'<span class="stat todo">Not started</span>';
    const dep=m.uses.length?`<span>Uses ${m.uses.join(' + ')}</span>`:'<span>Start here</span>';
    return `<div class="rstep ${cls}">
      <div class="rstep-dot"><div class="d">${done?'✓':m.icon}</div></div>
      <a class="mod" style="flex:1" href="tool.html?m=${m.n}">
        <div class="num">${String(m.n).padStart(2,'0')}</div>
        <div class="body">
          <h3>${m.name} ${stat}</h3>
          <p>${m.tag}</p>
          <div class="meta">${dep} · <span>Gives ${m.gives}</span></div>
          <span class="open">${done?'Review module':'Open module'} →</span>
        </div>
      </a></div>`;
  }).join('');

  const resetBtn=document.getElementById('resetData');
  if(resetBtn)resetBtn.addEventListener('click',()=>{
    if(confirm('Clear all your saved Lumpy data on this device? This cannot be undone.')){
      Store.reset();renderHub();
    }
  });
}

/* ---- landing: module cards ---- */
function renderLandingModules(){
  const host=document.getElementById('landingModules');
  if(!host)return;
  host.innerHTML=MODULES.map(m=>`
    <a class="mod" href="tool.html?m=${m.n}">
      <div class="num">${String(m.n).padStart(2,'0')}</div>
      <div class="body">
        <h3><span aria-hidden="true">${m.icon}</span> ${m.name}</h3>
        <p>${m.tag}</p>
        <span class="open">Open module →</span>
      </div>
    </a>`).join('');
}

/* ---- tool page ---- */
function initToolPage(){
  const wrap=document.getElementById('toolPage');
  if(!wrap)return;
  const params=new URLSearchParams(location.search);
  let n=parseInt(params.get('m'),10); if(!(n>=1&&n<=MODULES.length))n=1;
  const m=MODULES[n-1], p=Store.profile(), cur=p.currency||'R';

  document.title=`Lumpy - ${m.name}`;
  document.getElementById('tbNum').textContent=`Module ${n} of ${MODULES.length}`;
  document.getElementById('tbTitle').textContent=m.name;
  document.getElementById('tbTag').textContent=m.tag;

  /* prev / next pills */
  const navHost=document.getElementById('tbNav');
  const prev=n>1?`<a class="btn btn-ghost btn-sm" href="tool.html?m=${n-1}">← ${MODULES[n-2].name.split(' ')[0]}</a>`:`<a class="btn btn-ghost btn-sm" href="modules.html">← All modules</a>`;
  const next=n<MODULES.length?`<a class="btn btn-primary btn-sm" href="tool.html?m=${n+1}">${MODULES[n].name.split(' ')[0]} →</a>`:`<a class="btn btn-primary btn-sm" href="modules.html">Finish · view system →</a>`;
  navHost.innerHTML=prev+next;
  document.getElementById('footNav').innerHTML=prev+next;

  /* carried-over banner */
  const carry=document.getElementById('carry');
  const bits=[];
  if(n>=2&&n<=4&&p.income)bits.push(`your smoothed income of <b>${money(p.income,cur)}/month</b>`);
  if(n===3&&p.tier1)bits.push(`monthly essentials of <b>${money(p.tier1,cur)}</b>`);
  if(n===4&&p.shield)bits.push(`your Shield balance of <b>${money(p.shield,cur)}</b>`);
  if(n===5&&p.grossAnnual)bits.push(`your annual income of <b>${money(p.grossAnnual,cur)}</b> from Module 1`);
  if(bits.length){
    carry.style.display='flex';
    carry.innerHTML=`<span class="ci">↻</span><div>Carried over from your earlier modules: ${bits.join(' and ')}. It's already filled in below - change it anywhere and it updates everywhere.</div>`;
  }else if(n===1){
    carry.style.display='flex';
    carry.innerHTML=`<span class="ci">①</span><div>This is the foundation. The smoothed income you build here feeds every other module automatically.</div>`;
  }else if(n===6){
    let pl={};try{pl=JSON.parse(localStorage.getItem('lumpy_profile'))||{};}catch(e){}
    const loaded=['smoothedIncome','shieldTopup','t1','t2','t3','raMonthly','tfsaMonthly','effTaxRate','raAnnual'].filter(k=>pl[k]!=null).length;
    carry.style.display='flex';
    carry.innerHTML = loaded
      ? `<span class="ci">✓</span><div>The capstone. <b>${loaded} of 9</b> planning foundations were pulled in automatically from Modules 1-5 (shown in green in Step 1). Add your opening balances and 12-month forecast to see your full year.</div>`
      : `<span class="ci">①</span><div>The capstone brings Modules 1-5 together. Complete the earlier modules first and their figures auto-load here - or enter the nine foundations manually in Step 1.</div>`;
  }

  /* the tool iframe + auto height */
  const frame=document.getElementById('toolFrame');
  frame.src=m.file;
  window.addEventListener('message',(e)=>{
    const d=e.data||{};
    if(d.lumpy==='height'&&typeof d.height==='number'){
      frame.style.height=Math.max(560,d.height+8)+'px';
    }
    if(d.lumpy==='next'){
      location.href = n<MODULES.length?`tool.html?m=${n+1}`:'modules.html';
    }
    if(d.lumpy==='progress'||d.lumpy==='profile'){
      /* refresh the carried banner money if profile changed mid-session */
    }
  });
}

/* ---- boot ---- */
document.addEventListener('DOMContentLoaded',()=>{
  mountNav();mountRhythm();renderLandingModules();renderHub();initToolPage();
});
window.Lumpy={Store,MODULES,money};
})();
