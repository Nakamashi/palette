/* Palette Lab 3.0. Static, mobile-friendly app; Mixbox auto-loaded from local copy or official vendor URL.
   For fully offline Mixbox, run the included one-time installer to download the original library. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const DB=Array.isArray(window.PALETTE_CATALOG)?window.PALETTE_CATALOG:[];
const INITIAL=Array.isArray(window.PALETTE_INITIAL_OWNED)?window.PALETTE_INITIAL_OWNED:[];
const STORE='palette-lab-v2', LEGACY='palette-lab-v1';
const isHex=h=>/^#[0-9A-F]{6}$/i.test(String(h||''));
const normHex=h=>String(h).toUpperCase();
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>`custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const toRgb=h=>{let v=h.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16));};
const toHex=rgb=>'#'+rgb.slice(0,3).map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase();
const fixed=n=>Number(Number(n).toFixed(1)).toString();
const listIds=new Set(DB.map(p=>p.id));
const seedMix=[{id:'regular-045',parts:3},{id:'regular-003',parts:1},{id:'basics-titanium-white',parts:5}];
const firstState=()=>({version:2,ownedIds:[...INITIAL],excludedIds:[],overrides:{},custom:[],mix:clone(seedMix),recipes:[],target:'#9478A4',matchScope:'owned',maxIngredients:4,special:false,collapsed:{}});
const getSaved=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){console.warn('Could not save to this browser. Use Export backup.',e);}};
let state,engine='ryb',noticeTimer=null;
const latentCache=new Map();
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove('show'),2800);}
function mapLegacy(obj){
 if(!obj||!Array.isArray(obj.paints))return null;
 const result=firstState(), idMap=new Map();result.ownedIds=[];
 for(const p of obj.paints.slice(0,500)){
   if(!p || !p.name || !isHex(p.hex))continue;
   const brand=String(p.brand||'');const range=/regular/i.test(brand)?'Regular':/basics/i.test(brand)?'BASICS':null;
   const exact=DB.find(x=>x.name.toLowerCase()===String(p.name).toLowerCase() && (range?x.range===range:x.range==='Custom'));
   let match=exact;
   if(!match && !range)match=DB.find(x=>x.name.toLowerCase()===String(p.name).toLowerCase() && x.range==='Custom');
   if(!match){match={id:uid(),name:String(p.name).slice(0,80),brand:brand.slice(0,80)||'Custom',range:'Custom',hex:normHex(p.hex),kind:'standard',strength:1};result.custom.push(match);}
   else {result.overrides[match.id]={hex:normHex(p.hex),strength:clamp(Number(p.strength)||1,.3,3)};}
   result.ownedIds.push(match.id);idMap.set(String(p.id),match.id);
 }
 result.ownedIds=[...new Set(result.ownedIds)];
 result.mix=(Array.isArray(obj.mix)?obj.mix:[]).map(x=>({id:idMap.get(String(x.id)),parts:Number(x.parts)})).filter(x=>x.id&&x.parts>0);
 result.recipes=(Array.isArray(obj.recipes)?obj.recipes:[]).map(r=>({...r,mix:(Array.isArray(r.mix)?r.mix:[]).map(x=>({id:idMap.get(String(x.id)),parts:Number(x.parts)})).filter(x=>x.id&&x.parts>0)}));
 if(isHex(obj.target))result.target=normHex(obj.target);
 return result;
}
function sanitise(raw){
 if(!raw||typeof raw!=='object')return null;
 if(Array.isArray(raw.paints))return sanitise(mapLegacy(raw));
 if(Number(raw.version)!==2)return null;
 const out=firstState();
 out.custom=(Array.isArray(raw.custom)?raw.custom:[]).slice(0,400).filter(p=>p&&typeof p.id==='string'&&p.id.startsWith('custom-')&&typeof p.name==='string'&&isHex(p.hex)).map(p=>({id:p.id.slice(0,100),name:p.name.slice(0,80),brand:String(p.brand||'Custom').slice(0,80),range:'Custom',code:'',hex:normHex(p.hex),kind:['standard','metallic','fluorescent','transparent'].includes(p.kind)?p.kind:'standard',strength:clamp(Number(p.strength)||1,.3,3)})).filter(p=>!listIds.has(p.id));
 const all=new Set([...listIds,...out.custom.map(p=>p.id)]);
 out.ownedIds=[...new Set((Array.isArray(raw.ownedIds)?raw.ownedIds:[]).filter(x=>all.has(x)))];
 out.excludedIds=[...new Set((Array.isArray(raw.excludedIds)?raw.excludedIds:[]).filter(x=>all.has(x)))];
 out.overrides={};
 if(raw.overrides&&typeof raw.overrides==='object')for(const [id,override] of Object.entries(raw.overrides)){
    if(!all.has(id)||!override||typeof override!=='object')continue;
    const v={};if(isHex(override.hex))v.hex=normHex(override.hex);
    if(override.strength!==undefined)v.strength=clamp(Number(override.strength)||1,.3,3);
    if(typeof override.name==='string'&&override.name.trim())v.name=override.name.trim().slice(0,80);
    if(Object.keys(v).length)out.overrides[id]=v;
 }
 out.mix=(Array.isArray(raw.mix)?raw.mix:[]).slice(0,15).filter(x=>x && all.has(x.id) && Number(x.parts)>0).map(x=>({id:x.id,parts:clamp(Number(x.parts),.5,30)}));
 out.recipes=(Array.isArray(raw.recipes)?raw.recipes:[]).slice(0,200).filter(r=>r && Array.isArray(r.mix)).map(r=>({id:String(r.id||uid()).slice(0,90),name:String(r.name||'Untitled').slice(0,90),mix:r.mix.filter(x=>all.has(x.id)&&Number(x.parts)>0).map(x=>({id:x.id,parts:clamp(Number(x.parts),.5,30)})),hex:isHex(r.hex)?normHex(r.hex):'#888888',date:String(r.date||'').slice(0,40)}));
 out.target=isHex(raw.target)?normHex(raw.target):out.target;
 out.matchScope=['owned','BASICS','Regular','all'].includes(raw.matchScope)?raw.matchScope:'owned';
 out.maxIngredients=[2,3,4].includes(Number(raw.maxIngredients))?Number(raw.maxIngredients):4;
 out.special=!!raw.special;
 out.collapsed={};
 if(raw.collapsed&&typeof raw.collapsed==='object')for(const key of ['library','preview','matcher','mix','saved'])out.collapsed[key]=!!raw.collapsed[key];
 return out;
}
state=sanitise(getSaved(STORE))||sanitise(mapLegacy(getSaved(LEGACY)))||firstState();save();
const combined=()=>[...DB,...state.custom].map(p=>({...p,...(state.overrides[p.id]||{}),strength:state.overrides[p.id]?.strength??p.strength??1}));
let paints=combined(), byId=new Map(paints.map(p=>[p.id,p]));
const paint=id=>byId.get(id);
const owned=id=>state.ownedIds.includes(id);
const included=id=>!state.excludedIds.includes(id);
let tab='all';let matcherRunning=false;
function refreshPaintModel(){paints=combined();byId=new Map(paints.map(p=>[p.id,p]));latentCache.clear();}
function currentVisible(){
 const q=$('search-paints').value.trim().toLowerCase();return paints.filter(p=>(tab==='all'||p.range===tab)&&(!$('filter-owned').checked||owned(p.id))&&(!$('filter-enabled').checked||included(p.id))&&(!q||(p.name+' '+p.range+' '+p.code+' '+p.brand).toLowerCase().includes(q)));
}
function renderPaints(){
 const visible=currentVisible();const count=visible.length;
 $('visible-count').textContent=`${count} shown of ${paints.length}`;
 $('owned-count').textContent=state.ownedIds.length;
 $('catalog-count').textContent=paints.length;
 $('paint-list').innerHTML=visible.map(p=>{
 const isOwned=owned(p.id),isOn=included(p.id),added=state.mix.some(x=>x.id===p.id);
 return `<div class="paint-row ${isOn?'':'excluded'}" data-id="${esc(p.id)}"><span class="paint-swatch" style="background:${p.hex}"></span><div class="paint-info"><strong title="${esc(p.name)}">${esc(p.name)}</strong><small>${p.range==='Regular'?'Regular':p.range==='BASICS'?'BASICS':esc(p.brand)}${p.code?' · '+esc(p.code):''}</small></div><label class="mini-check" title="Mark as owned"><input type="checkbox" aria-label="I own ${esc(p.name)} (${esc(p.range)})" data-owned="${esc(p.id)}" ${isOwned?'checked':''}><span>Owned</span></label><label class="mini-check" title="Include this paint in mixing and matching"><input type="checkbox" aria-label="Include ${esc(p.name)} (${esc(p.range)})" data-included="${esc(p.id)}" ${isOn?'checked':''}><span>Include</span></label><button type="button" class="icon-tiny" data-edit="${esc(p.id)}" aria-label="Edit ${esc(p.name)}" title="Edit colour">✎</button><button type="button" class="icon-tiny paint-add ${added?'is-added':''}" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bowl" title="Add to mixing bowl" ${isOn?'':'disabled'}>${added?'✓':'+'}</button></div>`}).join('')||'<div class="saved-empty" style="padding:20px">No paints match these filters.</div>';
}
function renderMix(){
 const entries=state.mix.filter(i=>paint(i.id));
 $('ingredient-count').textContent=entries.length;$('empty-mix').hidden=entries.length>0;
 $('mix-list').innerHTML=entries.map(i=>{const p=paint(i.id);return `<div class="mix-row"><span class="mix-row-swatch" style="background:${p.hex}"></span><div class="mix-row-title"><strong title="${esc(p.name)}">${esc(p.name)}</strong><small>${esc(p.range)}</small></div><div class="range-wrap"><input data-parts="${esc(p.id)}" type="range" min="0.5" max="30" step="0.5" value="${i.parts}" aria-label="Parts of ${esc(p.name)}"><input class="parts-input" type="number" min="0.5" max="30" step="0.5" value="${fixed(i.parts)}" data-number="${esc(p.id)}" aria-label="Quantity of ${esc(p.name)}"></div><button type="button" class="remove-mix" data-remove="${esc(p.id)}" title="Remove paint" aria-label="Remove ${esc(p.name)}">×</button></div>`}).join('');
}
function parseMixboxOutput(out){
 if(Array.isArray(out))return out.slice(0,3).map(Number);
 if(typeof out==='object'&&out&&'r' in out)return [out.r,out.g,out.b].map(Number);
 if(typeof out==='string'){if(isHex(out))return toRgb(out);const parts=out.match(/-?\d+(?:\.\d+)?/g);if(parts&&parts.length>=3)return parts.slice(0,3).map(Number);}
 throw new Error('Unexpected Mixbox output');
}
function rgbToRyb(rgb){
 let[r,g,b]=rgb.map(n=>n/255);const w=Math.min(r,g,b);r-=w;g-=w;b-=w;const mg=Math.max(r,g,b);
 let y=Math.min(r,g);r-=y;g-=y;if(b>0&&g>0){b/=2;g/=2;}y+=g;b+=g;
 const my=Math.max(r,y,b);if(my>0){const n=mg/my;r*=n;y*=n;b*=n;}
 return [r+w,y+w,b+w];
}
function rybToRgb(ryb){
 let[r,y,b]=ryb;const w=Math.min(r,y,b);r-=w;y-=w;b-=w;const my=Math.max(r,y,b);
 let g=Math.min(y,b);y-=g;b-=g;if(b>0&&g>0){b*=2;g*=2;}r+=y;g+=y;
 const mg=Math.max(r,g,b);if(mg>0){const n=my/mg;r*=n;g*=n;b*=n;}return [r+w,g+w,b+w].map(n=>clamp(255*n,0,255));
}
function mixRGB(recipe){
 const valid=recipe.map(i=>({p:paint(i.id),parts:Number(i.parts)})).filter(i=>i.p&&i.parts>0);
 if(!valid.length)return [232,228,226];if(valid.length===1)return toRgb(valid[0].p.hex);
 const amounts=valid.map(i=>i.parts*i.p.strength),total=amounts.reduce((a,b)=>a+b,0);
 if(engine==='mixbox'&&window.mixbox?.rgbToLatent){
  try{
   const z=new Array(window.mixbox.LATENT_SIZE).fill(0);
   valid.forEach((i,k)=>{
    if(!latentCache.has(i.p.hex))latentCache.set(i.p.hex,window.mixbox.rgbToLatent('rgb('+toRgb(i.p.hex).join(',')+')'));
    const latent=latentCache.get(i.p.hex);
    for(let j=0;j<z.length;j++)z[j]+=(amounts[k]/total)*latent[j];
   });
   const out=parseMixboxOutput(window.mixbox.latentToRgb(z));
   if(out.every(Number.isFinite))return out;
  }catch(err){console.warn('Mixbox unavailable for this mixture; RYB fallback used',err);}
 }
 const sum=[0,0,0];valid.forEach((i,k)=>{const ryb=rgbToRyb(toRgb(i.p.hex));for(let j=0;j<3;j++)sum[j]+=ryb[j]*amounts[k]/total;});
 return rybToRgb(sum);
}
const mixHex=recipe=>toHex(mixRGB(recipe));
function rgbLab(rgb){
 const [r,g,b]=rgb.map(v=>{const x=v/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});
 const x=(r*.4124564+g*.3575761+b*.1804375)/.95047;
 const y=r*.2126729+g*.7151522+b*.072175;
 const z=(r*.0193339+g*.119192+b*.9503041)/1.08883;
 const f=t=>t>0.0088564517?Math.cbrt(t):(7.787037*t+16/116);
 const [a,c,d]=[x,y,z].map(f);return[116*c-16,500*(a-c),200*(c-d)];
}
function delta(a,b){return Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2);}
function renderPreview(){
 const hex=mixHex(state.mix),score=delta(rgbLab(toRgb(hex)),rgbLab(toRgb(state.target)));
 $('result-swatch').style.backgroundColor=hex;$('result-hex').textContent=hex;
 $('target-swatch').style.backgroundColor=state.target;$('target-hex-display').textContent=state.target;
 $('target-picker').value=state.target;
 if(document.activeElement!==$('target-hex-input'))$('target-hex-input').value=state.target;
 $('match-distance').textContent=state.mix.length?(score<4?'Very close on-screen':score<12?'Fairly close on-screen':`On-screen distance ${score.toFixed(1)}`):'';
 const total=state.mix.reduce((n,x)=>n+x.parts,0);
 $('recipe-summary').textContent=state.mix.length?state.mix.map(x=>`${fixed(x.parts)} ${paint(x.id)?.name||''}`).join('  +  ')+`  ·  ${fixed(total)} parts total`:'Select a paint from the library or load a suggested recipe.';
 $('save-mix').disabled=!state.mix.length;$('copy-hex').disabled=!state.mix.length;
}
function renderSaved(){
 $('saved-count').textContent=state.recipes.length;
 $('saved-grid').innerHTML=state.recipes.length?state.recipes.map(r=>`<article class="recipe-card"><div class="saved-swatch" style="background:${isHex(r.hex)?r.hex:'#888888'}"><span>${esc(r.hex)}</span></div><div class="recipe-card-body"><strong>${esc(r.name)}</strong><small>${r.mix.length} colours · ${esc(r.date)}</small><div class="recipe-card-actions"><button type="button" data-load="${esc(r.id)}">Load recipe</button><button type="button" data-delete-recipe="${esc(r.id)}">Delete</button></div></div></article>`).join(''):'<div class="saved-empty">No saved recipes yet. Try a colour in the mixing bowl, then save it here.</div>';
}
function renderAll(){renderPaints();renderMix();renderPreview();renderSaved();}
function addToMix(id){
 if(!included(id))return toast('This paint is excluded. Tick Include first.');
 const found=state.mix.find(x=>x.id===id);
 if(found)found.parts=clamp(found.parts+.5,.5,30);
 else if(state.mix.length>=15)return toast('A recipe can contain up to 15 paints.');
 else state.mix.push({id,parts:1});save();renderAll();
}
function setTarget(h){if(!isHex(h))return false;state.target=normHex(h);save();renderPreview();return true;}
function editPaint(id){
 const p=paint(id);$('edit-paint-id').value=id||'';
 $('modal-title').textContent=!p?'Add custom paint':p.range==='Custom'?'Edit custom paint':'Calibrate catalogue colour';
 $('paint-name').value=p?.name||'';$('paint-name').disabled=!!p&&p.range!=='Custom';
 $('paint-brand').value=p?.brand||'';$('paint-brand').disabled=!!p&&p.range!=='Custom';
 $('paint-hex').value=p?.hex||'#845A98';$('paint-picker').value=p?.hex||'#845A98';
 $('paint-strength').value=p?.strength||1;$('strength-value').textContent=(p?.strength||1).toFixed(1)+'×';
 $('delete-paint').hidden=!(p&&p.range==='Custom'&&!listIds.has(p.id));$('paint-dialog').showModal();
}
function matchPool(){return paints.filter(p=>included(p.id) && (state.special||!['metallic','fluorescent'].includes(p.kind)) && (state.matchScope==='all'||state.matchScope==='owned'&&owned(p.id)||p.range===state.matchScope));}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function bestDistinct(arr,n,signature){
 arr.sort((a,b)=>a.score-b.score);const seen=new Set(),out=[];
 for(const x of arr){const key=signature(x);if(seen.has(key))continue;seen.add(key);out.push(x);if(out.length>=n)break;}
 return out;
}
async function searchMixes(){
 if(matcherRunning)return;
 const pool=matchPool();if(pool.length===0){toast('No included colours in this collection.');$('match-status').textContent='No eligible colours. Check range, Included and special-finish settings.';return;}
 matcherRunning=true;$('find-match').disabled=true;$('find-match').textContent='Searching…';$('match-results').innerHTML='';$('see-match').hidden=true;
 const targetLab=rgbLab(toRgb(state.target));let scored=[];
 const labScore=rgb=>delta(rgbLab(rgb),targetLab);
 function exactScore(mix){const rgb=mixRGB(mix);return{mix:clone(mix),hex:toHex(rgb),score:labScore(rgb)};}
 try{
 $('match-status').textContent=`Searching ${pool.length} included colours in ${state.matchScope==='owned'?'your collection':state.matchScope==='all'?'all ranges':state.matchScope}…`;
 await tick();
 const single=pool.map(p=>exactScore([{id:p.id,parts:1}]));scored.push(...single);
 // Stage 1: search every *pair* with a cheap RYB prefilter. This bounds the costly Mixbox evaluations.
 const ryb=pool.map(p=>rgbToRyb(toRgb(p.hex)));
 const strengths=pool.map(p=>p.strength||1);
 const rough=[];
 for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
    for(const a of [1,2,4,6,8,9]){
       const aa=a*strengths[i],bb=(10-a)*strengths[j],t=aa+bb;
       const rgb=rybToRgb([0,1,2].map(k=>(ryb[i][k]*aa+ryb[j][k]*bb)/t));
       rough.push({i,j,a,score:labScore(rgb)});
    }
 }
 const nearPairs=bestDistinct(rough,65,x=>`${x.i}:${x.j}`);
 $('match-status').textContent=`Refining promising mixtures…`;
 await tick();
 // Stage 2: refine those pairs with the chosen engine and exact proportions.
 const refined=[];
 for(const r of nearPairs){for(let a=1;a<=9;a++)refined.push(exactScore([{id:pool[r.i].id,parts:a},{id:pool[r.j].id,parts:10-a}]));}
 scored.push(...refined);
 let topTriples=[];
 if(state.maxIngredients>=3 && pool.length>=3){
    // Stage 3: propose third pigments using the fast model, then only test promising triples with the real engine.
    const pairSeeds=bestDistinct(refined,32,x=>x.mix.map(p=>p.id).sort().join('|'));
    const idxById=new Map(pool.map((p,i)=>[p.id,i]));
    const roughThree=[];
    for(const seed of pairSeeds){
      const [a,b]=seed.mix.map(x=>({i:idxById.get(x.id),parts:x.parts}));
      for(let k=0;k<pool.length;k++){
        if(k===a.i||k===b.i)continue;
        for(const c of [1,3,5,8]){
          const aAmt=a.parts*strengths[a.i],bAmt=b.parts*strengths[b.i],cAmt=c*strengths[k],tot=aAmt+bAmt+cAmt;
          const rgb=rybToRgb([0,1,2].map(n=>(ryb[a.i][n]*aAmt+ryb[b.i][n]*bAmt+ryb[k][n]*cAmt)/tot));
          roughThree.push({ids:[a.i,b.i,k].sort((x,y)=>x-y),score:labScore(rgb)});
        }
      }
    }
    const tripleSeeds=bestDistinct(roughThree,72,r=>r.ids.join('|'));
    $('match-status').textContent='Checking final three-paint recipes…';
    await tick();
    const triples=[];
    for(const r of tripleSeeds){
      for(let a=1;a<=7;a++)for(let b=1;b<=8-a;b++){
        const c=9-a-b;if(c<1)continue;
        triples.push(exactScore([{id:pool[r.ids[0]].id,parts:a},{id:pool[r.ids[1]].id,parts:b},{id:pool[r.ids[2]].id,parts:c}]));
      }
    }
    scored.push(...triples);
    topTriples=bestDistinct(triples,24,x=>x.mix.map(p=>p.id).sort().join('|'));
 }
 if(state.maxIngredients>=4 && pool.length>=4 && topTriples.length){
   // 4 ingredients: never enumerate C(n,4) groups. Extend strong triples
   // with an RYB shortlist, then evaluate/refine with actual Mixbox scores.
   $('match-status').textContent='Searching four-paint combinations…';
   await tick();
   const iById=new Map(pool.map((p,i)=>[p.id,i]));
   const roughFour=[];
   for(const base of topTriples){
     const seeds=base.mix.map(i=>({index:iById.get(i.id),parts:i.parts}));
     const ids=new Set(seeds.map(i=>i.index));
     for(let fourth=0;fourth<pool.length;fourth++){
       if(ids.has(fourth))continue;
       for(const extra of [1,2,4,7]){
         const all=[...seeds,{index:fourth,parts:extra}];
         let sum=0;const acc=[0,0,0];
         for(const ent of all){
           const weight=ent.parts*strengths[ent.index];sum+=weight;
           for(let n=0;n<3;n++)acc[n]+=ryb[ent.index][n]*weight;
         }
         const roughScore=labScore(rybToRgb(acc.map(n=>n/sum)));
         roughFour.push({mix:[...base.mix,{id:pool[fourth].id,parts:extra}],score:roughScore});
       }
     }
   }
   // Deduplicate pigment sets, while retaining multiple leading weight profiles.
   roughFour.sort((a,b)=>a.score-b.score);
   const selected=[],sets=new Map();
   for(const r of roughFour){
     const key=r.mix.map(p=>p.id).sort().join('|');
     const count=sets.get(key)||0;if(count>=2)continue;
     selected.push(r);sets.set(key,count+1);if(selected.length>=140)break;
   }
   $('match-status').textContent='Refining four-paint recipes with the active mixing model…';
   await tick();
   const fours=[];
   for(const r of selected){
     for(const amount of [0.5,1,2,3,5,8]){
       const m=r.mix.map((x,i)=>({...x,parts:i===3?amount:x.parts}));
       fours.push(exactScore(m));
     }
   }
   // Coordinate refinement keeps the search bounded and mobile-friendly.
   const refinedFour=bestDistinct(fours,20,x=>x.mix.map(m=>m.id).sort().join('|'));
   for(const item of refinedFour){
     let best=item;
     for(let pass=0;pass<3;pass++){
       let improved=false;
       for(let k=0;k<4;k++){
         for(const multiple of [.5,.75,1.35,1.8,2.5]){
           const candidate=best.mix.map((v,j)=>({id:v.id,parts:j===k?clamp(Math.round(v.parts*multiple*2)/2,.5,30):v.parts}));
           const score=exactScore(candidate);
           if(score.score+1e-7<best.score){best=score;improved=true;}
         }
       }
       if(!improved)break;
     }
     fours.push(best);
   }
   scored.push(...fours);
 }
 const unique=bestDistinct(scored,130,x=>x.mix.map(m=>m.id).sort().join('|'));
 // Return a useful variety, not five micro-adjustments of precisely the same recipe.
 const best=unique.slice(0,3);
 $('match-results').innerHTML=best.map((r,i)=>`<div class="match-card"><div class="match-chip" style="background:${r.hex}"></div><div class="match-description"><strong>${i===0?'Best found · loaded':'Alternative '+i} · ${r.hex}</strong><small>${r.mix.map(m=>`${fixed(m.parts)} ${esc(paint(m.id)?.name||'')}`).join(' + ')}<br>On-screen colour distance: ${r.score.toFixed(1)}</small></div>${i===0?'<span class="loaded-tag">In bowl</span>':`<button type="button" class="secondary-button" data-use-match="${i}">Use mix</button>`}</div>`).join('');
 matches=best.map(r=>r.mix);
 if(best.length){
   $('see-match').hidden=false;
   state.mix=clone(best[0].mix);
   state.collapsed.mix=false;
   applyCollapse('mix');
   save();
   renderMix();renderPreview();renderPaints();
 }
 $('match-status').textContent=`Best found loaded into your mixing bowl automatically. Searched ${pool.length} paints, using up to ${state.maxIngredients} ingredients. Smaller distance means a closer predicted on-screen match, not a guaranteed physical match.`;
 }catch(error){console.error(error);$('match-status').textContent='Colour search failed. Please try again.';toast('Could not finish the search.');}
 finally{matcherRunning=false;$('find-match').disabled=false;$('find-match').innerHTML='Find closest mix <span>↗</span>';}
}
let matches=[];
function exportBackup(){
 const backup={...state,format:'palette-lab-v2',exportedAt:new Date().toISOString()};
 const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=`palette-lab-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Backup downloaded. Keep it somewhere safe.');
}
function beginMixbox(){
 const show=()=>{engine='mixbox';latentCache.clear();$('engine-pill').classList.add('is-mixbox');$('engine-label').textContent='Mixbox active';renderPreview();};
 if(window.mixbox?.rgbToLatent){show();return;}
 const addScript=(src,success,failure)=>{
   const el=document.createElement('script');el.src=src;el.async=true;
   el.onload=()=>window.mixbox?.rgbToLatent?success():failure();
   el.onerror=failure;document.head.append(el);
 };
 $('engine-label').textContent='Loading Mixbox…';
 // A local copy makes the app fully offline. Otherwise use the official library automatically.
 addScript('./mixbox.js',show,()=>addScript('https://scrtwpns.com/mixbox.js',show,()=>{
   $('engine-label').textContent='RYB fallback · offline';
   $('engine-pill').classList.remove('is-mixbox');
   console.warn('Mixbox could not load. Run install-mixbox-windows.bat once while online for offline access.');
 }));
}
const collapseIds={library:'library-panel',preview:'preview-panel',matcher:'matcher-panel',mix:'mix-panel',saved:'saved-panel'};
function applyCollapse(key){
 const panel=$(collapseIds[key]);if(!panel)return;
 const closed=!!state.collapsed[key];
 panel.classList.toggle('is-collapsed',closed);
 const btn=panel.querySelector('.collapse-button');
 if(btn){btn.setAttribute('aria-expanded',String(!closed));btn.setAttribute('aria-label',`${closed?'Expand':'Collapse'} ${key} section`);btn.title=`${closed?'Expand':'Collapse'} section`;btn.querySelector('span').textContent=closed?'Expand':'Collapse';}
}
function initCollapse(){
 const titleMap={library:'.panel-heading',preview:'.preview-topline',matcher:'.matcher-heading',mix:'.mix-heading',saved:'.saved-header'};
 for(const [key,id] of Object.entries(collapseIds)){
   const panel=$(id),header=panel.querySelector(titleMap[key]);
   const wrapper=document.createElement('div');wrapper.className='panel-content';wrapper.id='panel-content-'+key;
   while(header.nextSibling)wrapper.appendChild(header.nextSibling);
   panel.appendChild(wrapper);
   const button=document.createElement('button');button.type='button';button.className='collapse-button';
   button.setAttribute('aria-controls',wrapper.id);
   button.innerHTML='<span>Collapse</span><b aria-hidden="true"></b>';
   const existing=header.querySelector('.small-add, .preview-hint, .tiny-label, #clear-mix');
   if(existing){
     const actions=document.createElement('div');actions.className='panel-heading-actions';
     existing.parentNode.insertBefore(actions,existing);actions.append(existing,button);
   }else header.append(button);
   button.addEventListener('click',()=>{state.collapsed[key]=!state.collapsed[key];applyCollapse(key);save();});
   applyCollapse(key);
 }
 $('expand-all').addEventListener('click',()=>{for(const key of Object.keys(collapseIds)){state.collapsed[key]=false;applyCollapse(key);}save();});
 $('collapse-all').addEventListener('click',()=>{for(const key of Object.keys(collapseIds)){state.collapsed[key]=true;applyCollapse(key);}save();});
}

function bind(){
 document.querySelectorAll('.range-tab').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;document.querySelectorAll('.range-tab').forEach(x=>x.classList.toggle('active',x===b));renderPaints();}));
 $('search-paints').addEventListener('input',renderPaints);
 $('filter-owned').addEventListener('change',renderPaints);$('filter-enabled').addEventListener('change',renderPaints);
 $('paint-list').addEventListener('change',e=>{
   if(e.target.matches('[data-owned]')){
      const id=e.target.dataset.owned;
      state.ownedIds=e.target.checked?[...new Set([...state.ownedIds,id])]:state.ownedIds.filter(x=>x!==id);
      save();renderPaints();return;
   }
   if(e.target.matches('[data-included]')){
      const id=e.target.dataset.included;
      state.excludedIds=e.target.checked?state.excludedIds.filter(x=>x!==id):[...new Set([...state.excludedIds,id])];
      save();renderPaints();return;
   }
 });
 $('paint-list').addEventListener('click',e=>{
   const add=e.target.closest('[data-add]');if(add){addToMix(add.dataset.add);return;}
   const edit=e.target.closest('[data-edit]');if(edit)editPaint(edit.dataset.edit);
 });
 for(const [id,flag] of [['enable-visible',true],['disable-visible',false]])$(id).addEventListener('click',()=>{
   const visible=currentVisible().map(p=>p.id);if(!visible.length)return;
   if(visible.length>40&&!window.confirm(`${flag?'Include':'Exclude'} all ${visible.length} currently shown paints?`))return;
   const set=new Set(state.excludedIds);visible.forEach(id=>flag?set.delete(id):set.add(id));state.excludedIds=[...set];save();renderPaints();toast(`${visible.length} paints updated.`);
 });
 $('add-paint').addEventListener('click',()=>editPaint(''));
 $('paint-picker').addEventListener('input',e=>$('paint-hex').value=normHex(e.target.value));
 $('paint-hex').addEventListener('input',e=>{if(isHex(e.target.value))$('paint-picker').value=e.target.value;});
 $('paint-strength').addEventListener('input',e=>$('strength-value').textContent=Number(e.target.value).toFixed(1)+'×');
 $('paint-form').addEventListener('submit',e=>{
  e.preventDefault();const id=$('edit-paint-id').value,name=$('paint-name').value.trim(),brand=$('paint-brand').value.trim(),hex=normHex($('paint-hex').value.trim()),strength=Number($('paint-strength').value);
  if(!isHex(hex)||!name||!brand){toast('Enter a name, brand and valid 6-digit HEX.');return;}
  if(id&&listIds.has(id)){state.overrides[id]={...(state.overrides[id]||{}),hex,strength};}
  else if(id&&paint(id)){const item=state.custom.find(p=>p.id===id);if(item)Object.assign(item,{name,brand,hex,strength});}
  else {const newId=uid();state.custom.push({id:newId,name,brand,hex,strength,range:'Custom',code:'',kind:'standard'});state.ownedIds.push(newId);}
  save();refreshPaintModel();$('paint-dialog').close();renderAll();toast('Paint saved.');
 });
 $('delete-paint').addEventListener('click',()=>{
  const id=$('edit-paint-id').value;if(listIds.has(id)||!state.custom.some(x=>x.id===id))return;
  if(!window.confirm('Delete this custom paint? Any recipes using it will lose that ingredient.'))return;
  state.custom=state.custom.filter(p=>p.id!==id);state.ownedIds=state.ownedIds.filter(x=>x!==id);state.excludedIds=state.excludedIds.filter(x=>x!==id);state.mix=state.mix.filter(x=>x.id!==id);state.recipes.forEach(r=>r.mix=r.mix.filter(x=>x.id!==id));save();refreshPaintModel();$('paint-dialog').close();renderAll();
 });
 for(const id of ['close-paint','cancel-paint'])$(id).addEventListener('click',()=>$('paint-dialog').close());
 $('about-button').addEventListener('click',()=>$('about-dialog').showModal());
 for(const id of ['close-about','done-about'])$(id).addEventListener('click',()=>$('about-dialog').close());
 $('mix-list').addEventListener('input',e=>{
    if(!e.target.matches('[data-parts]'))return;
    const item=state.mix.find(i=>i.id===e.target.dataset.parts);if(!item)return;
    item.parts=clamp(Number(e.target.value),.5,30);
    e.target.closest('.range-wrap').querySelector('[data-number]').value=fixed(item.parts);save();renderPreview();
 });
 $('mix-list').addEventListener('change',e=>{
    if(!e.target.matches('[data-number]'))return;const item=state.mix.find(i=>i.id===e.target.dataset.number);if(!item)return;
    const n=Number(e.target.value);if(Number.isFinite(n))item.parts=clamp(Math.round(n*2)/2,.5,30);
    save();renderMix();renderPreview();
 });
 $('mix-list').addEventListener('click',e=>{const remove=e.target.closest('[data-remove]');if(!remove)return;state.mix=state.mix.filter(x=>x.id!==remove.dataset.remove);save();renderAll();});
 $('clear-mix').addEventListener('click',()=>{state.mix=[];save();renderAll();});
 $('reset-mix').addEventListener('click',()=>{state.mix=clone(seedMix);save();renderAll();});
 $('target-picker').addEventListener('input',e=>setTarget(e.target.value));
 $('target-hex-input').addEventListener('change',e=>{if(!setTarget(e.target.value.trim())){toast('Enter HEX like #9478A4.');e.target.value=state.target;}});
 $('copy-hex').addEventListener('click',async()=>{const value=mixHex(state.mix);try{await navigator.clipboard.writeText(value);toast(`Copied ${value}`);}catch{window.prompt('Copy this HEX:',value);}});
 $('photo-file').addEventListener('change',e=>{
   const file=e.target.files[0];if(!file)return;const url=URL.createObjectURL(file);const img=new Image();
   img.onload=()=>{const canvas=$('photo-canvas'),s=Math.min(1,600/img.width,330/img.height);canvas.width=Math.max(1,Math.round(img.width*s));canvas.height=Math.max(1,Math.round(img.height*s));canvas.getContext('2d',{willReadFrequently:true}).drawImage(img,0,0,canvas.width,canvas.height);$('photo-preview').hidden=false;URL.revokeObjectURL(url);};
   img.onerror=()=>{toast('Could not open that image.');URL.revokeObjectURL(url);};img.src=url;e.target.value='';
 });
 $('photo-canvas').addEventListener('click',e=>{const c=e.currentTarget,box=c.getBoundingClientRect();const x=clamp(Math.floor((e.clientX-box.left)*c.width/box.width),0,c.width-1),y=clamp(Math.floor((e.clientY-box.top)*c.height/box.height),0,c.height-1);const rgba=c.getContext('2d').getImageData(x,y,1,1).data;setTarget(toHex(rgba));toast('Target colour selected from your picture.');});
 $('match-scope').value=state.matchScope;$('max-ingredients').value=String(state.maxIngredients);$('special-finishes').checked=state.special;
 $('match-scope').addEventListener('change',e=>{state.matchScope=e.target.value;save();});
 $('max-ingredients').addEventListener('change',e=>{state.maxIngredients=Number(e.target.value);save();});
 $('special-finishes').addEventListener('change',e=>{state.special=e.target.checked;save();});
 $('find-match').addEventListener('click',searchMixes);
 $('match-results').addEventListener('click',e=>{const button=e.target.closest('[data-use-match]');if(!button)return;const recipe=matches[Number(button.dataset.useMatch)];if(!recipe)return;state.mix=clone(recipe);save();renderAll();toast('Suggested recipe loaded into the mixing bowl.');});
 $('save-mix').addEventListener('click',()=>{
    if(!state.mix.length)return;const suggested=`Colour ${state.recipes.length+1}`;const name=window.prompt('Give your recipe a name:',suggested);if(name===null)return;
    state.recipes.unshift({id:uid(),name:name.trim().slice(0,90)||suggested,mix:clone(state.mix),hex:mixHex(state.mix),date:new Date().toLocaleDateString('en-GB')});state.recipes=state.recipes.slice(0,200);save();renderSaved();toast('Recipe saved.');
 });
 $('saved-grid').addEventListener('click',e=>{
    const load=e.target.closest('[data-load]');if(load){const r=state.recipes.find(x=>x.id===load.dataset.load);if(!r)return;state.mix=clone(r.mix);save();renderAll();toast('Saved recipe loaded.');return;}
    const del=e.target.closest('[data-delete-recipe]');if(del&&window.confirm('Delete this saved recipe?')){state.recipes=state.recipes.filter(x=>x.id!==del.dataset.deleteRecipe);save();renderSaved();}
 });
 $('export-data').addEventListener('click',exportBackup);
 $('import-data').addEventListener('click',()=>$('import-file').click());
 $('import-file').addEventListener('change',async e=>{
   const file=e.target.files[0];if(!file)return;
   try{const raw=JSON.parse(await file.text());const parsed=sanitise(raw);if(!parsed)throw Error('Unsupported backup');
    if(!window.confirm('Replace your owned paints, exclusions, custom colours and saved recipes with this backup? Export your current backup first.'))return;
    state=parsed;refreshPaintModel();for(const key of Object.keys(collapseIds))applyCollapse(key);save();renderAll();$('match-scope').value=state.matchScope;$('max-ingredients').value=String(state.maxIngredients);$('special-finishes').checked=state.special;toast('Backup imported.');
   }catch(err){console.error(err);toast('Import failed: '+err.message);}finally{e.target.value='';}
 });
}
initCollapse();bind();renderAll();beginMixbox();
})();
