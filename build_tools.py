#!/usr/bin/env python3
"""Wrap each Lumpy tool fragment into a standalone HTML document and inject the
Lumpy bridge: cross-module prefill, local persistence, progress marking, in-tool
"next module" navigation, and seamless iframe height reporting.

The original tool logic is preserved verbatim. The bridge only reads/writes
localStorage and the tools' already-global helper functions (getSm, tax, cur,
gS). It never modifies any financial calculation.
"""
import pathlib

TOOLS = {
    "m1-income-smoothing.html": {"m": 1, "max": 4, "title": "Income Smoothing System"},
    "m2-smart-spending.html":   {"m": 2, "max": 4, "title": "Smart Spending Framework"},
    "m3-stability.html":        {"m": 3, "max": 5, "title": "5-Year Stability Plan"},
    "m4-credit.html":           {"m": 4, "max": 5, "title": "Credit Readiness Strategy"},
    "m5-tax.html":              {"m": 5, "max": 4, "title": "Tax Management System"},
    "m6-annual-planner.html":   {"m": 6, "max": 5, "title": "Annual Financial Planner"},
}

BRIDGE = r"""
<script>
/* Lumpy shell bridge - does NOT touch any tool calculation. */
(function(){
  var M=__M__, MAXSTEP=__MAX__;
  var PKEY='lumpy_profile_v1', GKEY='lumpy_progress_v1', TKEY='lumpy_tool_'+M+'_v1', PLKEY='lumpy_profile';
  function rp(){try{return JSON.parse(localStorage.getItem(PKEY))||{}}catch(e){return{}}}
  function wp(p){try{localStorage.setItem(PKEY,JSON.stringify(p))}catch(e){}}
  function rpl(){try{return JSON.parse(localStorage.getItem(PLKEY))||{}}catch(e){return{}}}
  function savedStr(){try{var d=new Date();return d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)}catch(e){return 'just now'}}
  function post(type,extra){try{if(window.parent&&window.parent!==window){var m={lumpy:type,module:M};if(extra)for(var k in extra)m[k]=extra[k];window.parent.postMessage(m,'*')}}catch(e){}}
  function patch(o){var p=rp(),ch=false;for(var k in o){var val=o[k];if(val===null||val===undefined||val==='')continue;if(typeof val==='number'&&(isNaN(val)||!isFinite(val)))continue;if(p[k]!==val){p[k]=val;ch=true}}if(ch){wp(p);post('profile',{profile:p})}}
  /* lumpy_profile: the 9-field foundation object that Module 6 (Annual Planner) reads. */
  function patchPl(o){var p=rpl(),ch=false;for(var k in o){var val=o[k];if(val===null||val===undefined||val==='')continue;if(typeof val==='number'&&(isNaN(val)||!isFinite(val)))continue;if(p[k]!==val){p[k]=val;ch=true}}if(ch){p.savedAt=savedStr();try{localStorage.setItem(PLKEY,JSON.stringify(p))}catch(e){}post('profile',{})}}
  function setV(id,val){var el=document.getElementById(id);if(!el||val===null||val===undefined||val==='')return;el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
  function num(id){var el=document.getElementById(id);if(!el)return null;var n=parseFloat(el.value);return isNaN(n)?null:n;}

  /* Dynamically-added rows (expenses / deductions) - saved and replayed via each tool's own add fn. */
  var ROWS={1:{c:'#expList',add:'addE',sel:'.er'},2:{c:'#expList',add:'addExp',sel:'.exp-row'},5:{c:'#dedList',add:'addDed',sel:'.deduct-row'}};
  function readRows(){var cfg=ROWS[M];if(!cfg)return null;var box=document.querySelector(cfg.c);if(!box)return null;var out=[];box.querySelectorAll(cfg.sel).forEach(function(r){var t=r.querySelector('input[type=text]'),s=r.querySelector('select'),a=r.querySelector('input[type=number]');out.push([t?t.value:'',a?(parseFloat(a.value)||0):0,s?s.value:'']);});return out;}
  function restoreRows(){var cfg=ROWS[M];if(!cfg)return;var raw=null;try{raw=localStorage.getItem(TKEY+'_rows')}catch(e){return}if(raw===null)return;var rows;try{rows=JSON.parse(raw)}catch(e){return}if(!Array.isArray(rows))return;var box=document.querySelector(cfg.c),addFn=window[cfg.add];if(!box||typeof addFn!=='function')return;var g=0;while(box.querySelector('.del')&&g++<200){box.querySelector('.del').click();}rows.forEach(function(r){try{addFn(r[0],r[1],r[2])}catch(e){}});}

  /* Module 6 income forecast persistence (the 12 forecast cells have no ids). */
  function readForecast(){var g=document.getElementById('incomeGrid');if(!g)return null;return [].map.call(g.querySelectorAll('input[type=number]'),function(i){return i.value});}
  function applyForecast(){var raw=null;try{raw=localStorage.getItem(TKEY+'_forecast')}catch(e){return}if(!raw)return;var arr;try{arr=JSON.parse(raw)}catch(e){return}if(!Array.isArray(arr))return;var g=document.getElementById('incomeGrid');if(!g)return;var ins=g.querySelectorAll('input[type=number]');arr.forEach(function(val,i){if(ins[i]&&val!==''&&val!=null){ins[i].value=val;ins[i].dispatchEvent(new Event('input',{bubbles:true}));}});}
  if(M===6&&typeof buildIncomeGrid==='function'){var _big=buildIncomeGrid;window.buildIncomeGrid=function(){var r=_big.apply(this,arguments);applyForecast();return r;};}

  /* The tools' "Next module" buttons call sendPrompt(); repurpose it to advance within the shell. */
  window.sendPrompt=function(){post('next');};

  /* 1) Restore this tool's own previously entered fields (Module 6 foundations are owned by loadProfile). */
  var SKIP6=(M===6)?{smoothedIncome:1,shieldTopup:1,t1:1,t2:1,t3:1,raMonthly:1,tfsaMonthly:1,effTaxRate:1,raAnnual:1}:null;
  try{var s=JSON.parse(localStorage.getItem(TKEY))||{};Object.keys(s).forEach(function(id){if(SKIP6&&SKIP6[id])return;var el=document.getElementById(id);if(el&&document.activeElement!==el){el.value=s[id];el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}});}catch(e){}
  restoreRows();

  /* 2) Prefill shared values from earlier modules (these win over stale local copies). */
  var p=rp();
  if(M===2){setV('smoothed',p.income);setV('cur',p.currency);}
  if(M===3){setV('income',p.income);setV('t1exp',p.tier1);}
  if(M===4){setV('income',p.income);setV('shieldBal',p.shield);setV('raValue',p.raValue);}
  if(M===5){setV('grossIncome',p.grossAnnual);}
  /* Module 6 prefills itself via its own loadProfile() reading 'lumpy_profile'. */

  /* 3) Harvest: persist fields and push shared outputs to both the shell profile and the planner profile. */
  function tier1FromDOM(){var t=0;document.querySelectorAll('#expList .er').forEach(function(r){var sel=r.querySelector('select'),amt=r.querySelector('input[type=number]');if(sel&&amt&&sel.value==='1')t+=parseFloat(amt.value)||0;});return t;}
  function snap(){
    try{var map={};document.querySelectorAll('input[id],select[id]').forEach(function(el){if(el.id&&el.type!=='button')map[el.id]=el.value;});localStorage.setItem(TKEY,JSON.stringify(map));}catch(e){}
    try{var rr=readRows();if(rr)localStorage.setItem(TKEY+'_rows',JSON.stringify(rr));}catch(e){}
    try{if(M===6){var fc=readForecast();if(fc)localStorage.setItem(TKEY+'_forecast',JSON.stringify(fc));}}catch(e){}
    try{
      if(M===1){
        var o={};if(typeof getSm==='function'){var sm=getSm();if(sm>0)o.income=Math.round(sm);}if(typeof tax==='function'){o.taxRate=tax();}if(typeof cur==='function'){o.currency=cur();}var t1=tier1FromDOM();if(t1>0)o.tier1=Math.round(t1);var ga=0;for(var i=0;i<12;i++){var mi=document.getElementById('m'+i);if(mi)ga+=parseFloat(mi.value)||0;}if(ga>0)o.grossAnnual=Math.round(ga);patch(o);
        var pl={};var smx=(typeof getSm==='function')?getSm():0;if(smx>0)pl.smoothedIncome=Math.round(smx);if(typeof tax==='function')pl.effTaxRate=Math.round(tax());
        try{var rt=(typeof tax==='function')?tax()/100:0;var tA=smx*rt;var tE=0;document.querySelectorAll('#expList .er input[type=number]').forEach(function(x){tE+=parseFloat(x.value)||0;});var lA=Math.min(tE,smx-tA);var bA=Math.max(0,smx-tA-lA);if(smx>0)pl.shieldTopup=Math.round(bA);}catch(e){}
        patchPl(pl);
      }
      if(M===2){var pl2={};if(typeof totByTier==='function'){pl2.t1=Math.round(totByTier('1'));pl2.t2=Math.round(totByTier('2'));pl2.t3=Math.round(totByTier('3'));}patchPl(pl2);}
      if(M===3){patch({shield:num('shieldBal'),raValue:num('raValue'),tier1:num('t1exp'),income:num('income')});patchPl({raMonthly:num('raMonthly'),tfsaMonthly:num('tfsaMonthly')});}
      if(M===5){var pl5={};var er=document.getElementById('effRate');if(er){var ev=parseFloat((er.textContent||'').replace(/[^0-9.]/g,''));if(!isNaN(ev)&&ev>0)pl5.effTaxRate=Math.round(ev);}var rcv=num('raContrib');if(rcv!=null)pl5.raAnnual=rcv;patchPl(pl5);}
    }catch(e){}
    post('profile',{profile:rp()});
  }
  document.addEventListener('change',function(){snap();},true);
  document.addEventListener('input',function(){clearTimeout(window.__lsnap);window.__lsnap=setTimeout(snap,450);},true);

  /* 4) Mark the module complete when its final step is reached. */
  if(typeof gS==='function'){var _g=gS;window.gS=function(n){_g(n);try{if(n>=MAXSTEP){var g=JSON.parse(localStorage.getItem(GKEY))||{};if(!g['m'+M]){g['m'+M]=Date.now();localStorage.setItem(GKEY,JSON.stringify(g));}post('progress');}}catch(e){}snap();};}

  /* 5) Report height so the shell can size the iframe with no inner scrollbar. */
  function rh(){var lw=document.querySelector('.lw');var h=Math.max(document.body.scrollHeight,document.body.offsetHeight,lw?Math.ceil(lw.getBoundingClientRect().bottom):0);post('height',{height:h});}
  window.addEventListener('load',function(){rh();setTimeout(rh,250);setTimeout(rh,800);});
  if(window.ResizeObserver){try{new ResizeObserver(function(){rh()}).observe(document.body)}catch(e){}}
  window.addEventListener('resize',rh);setInterval(rh,1500);
})();
</script>
"""

SHIM = """
<script>
/* window.storage shim - lets tools written for the Claude artifact storage API
   run on a plain static host by backing them with localStorage. No-op if a real
   window.storage already exists. */
window.storage = window.storage || {
  get:function(k){try{var v=localStorage.getItem(k);return Promise.resolve(v==null?null:{key:k,value:v})}catch(e){return Promise.resolve(null)}},
  set:function(k,v){try{localStorage.setItem(k,v);return Promise.resolve({key:k,value:v})}catch(e){return Promise.resolve(null)}},
  delete:function(k){try{localStorage.removeItem(k);return Promise.resolve({key:k,deleted:true})}catch(e){return Promise.resolve(null)}},
  list:function(pfx){try{var ks=[];for(var i=0;i<localStorage.length;i++){var kk=localStorage.key(i);if(!pfx||kk.indexOf(pfx)===0)ks.push(kk)}return Promise.resolve({keys:ks})}catch(e){return Promise.resolve({keys:[]})}}
};
</script>
"""

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Lumpy - {title}</title>
<style>
  html,body{{margin:0;padding:0;background:#FAF8F4;}}
  body{{padding:2px;}}
</style>
</head>
<body>
"""

FOOT = "\n</body>\n</html>\n"

base = pathlib.Path("/home/claude/lumpy/tools")
DASHES = {"\u2012": "-", "\u2013": "-", "\u2014": "-", "\u2015": "-", "\u2212": "-"}
def normalize_dashes(s):
    for k, v in DASHES.items():
        s = s.replace(k, v)
    return s
for fname, cfg in TOOLS.items():
    frag = (base / fname).read_text(encoding="utf-8")
    bridge = BRIDGE.replace("__M__", str(cfg["m"])).replace("__MAX__", str(cfg["max"]))
    doc = HEAD.format(title=cfg["title"]) + SHIM + frag + bridge + FOOT
    doc = normalize_dashes(doc)
    (base / fname).write_text(doc, encoding="utf-8")
    print(f"wrapped {fname}  (module {cfg['m']}, {len(doc)} bytes)")
print("done")
