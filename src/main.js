import OBR from '@owlbear-rodeo/sdk';
import './style.css';
const ID='com.fullpeople.baldur-initiative-bar', IK=ID+'/initiative', TK=ID+'/turn'; let items=[], turn={currentId:null,round:1};
document.querySelector('#app').innerHTML=`<section class="shell"><header><div class="brand"><div class="crest">⚔</div><div><b>INITIATIVE</b><small>BATTLE ORDER</small></div></div><div class="round"><small>ROUND</small><strong id="round">1</strong></div><button id="clear">×</button></header><div class="controls"><button id="prev">‹</button><div id="turn">No combatants</div><button id="next">›</button></div><div id="track"></div><footer><span id="count">0 combatants</span><span>Double-click to edit</span></footer></section>`;
const track=document.querySelector('#track'),roundEl=document.querySelector('#round'),turnEl=document.querySelector('#turn'),countEl=document.querySelector('#count');
const init=i=>Number.isFinite(Number(i?.metadata?.[IK]))?Number(i.metadata[IK]):null;
const list=()=>items.filter(i=>i.layer==='CHARACTER'&&init(i)!==null).map(i=>({item:i,initiative:init(i),name:i.name||'Unknown',image:i.image?.url||''})).sort((a,b)=>b.initiative-a.initiative||a.name.localeCompare(b.name));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function save(){await OBR.room.setMetadata({[TK]:turn})}
function render(){const l=list();track.replaceChildren();roundEl.textContent=turn.round;countEl.textContent=`${l.length} combatant${l.length===1?'':'s'}`;if(!l.length){turnEl.textContent='No combatants';track.innerHTML='<div class="empty">Add characters to the initiative tracker.</div>';return}const cur=l.find(x=>x.item.id===turn.currentId);turnEl.textContent=cur?`Turn: ${cur.name}`:'Select a turn';for(const x of l){const b=document.createElement('button');b.className='combatant'+(x.item.id===turn.currentId?' active':'');b.innerHTML=`<div class="portrait">${x.image?`<img src="${x.image}">`:`<span>${esc(x.name[0]||'?')}</span>`}<i>${x.initiative}</i></div><label>${esc(x.name)}</label>`;b.onclick=async()=>{turn.currentId=x.item.id;await save();render()};b.ondblclick=()=>edit(x.item);track.appendChild(b)}}
async function edit(item){const v=prompt(`Initiative for ${item.name||'character'}:`,String(init(item)));if(v===null)return;const n=Number(v);if(!Number.isFinite(n))return;await OBR.scene.items.updateItems([item],a=>a.forEach(i=>i.metadata[IK]=n))}
async function advance(d){const l=list();if(!l.length)return;let i=l.findIndex(x=>x.item.id===turn.currentId);if(i<0)i=d>0?-1:0;const n=i+d;if(n>=l.length){turn.round++;turn.currentId=l[0].item.id}else if(n<0){turn.round=Math.max(1,turn.round-1);turn.currentId=l[l.length-1].item.id}else turn.currentId=l[n].item.id;await save();render()}
document.querySelector('#next').onclick=()=>advance(1);document.querySelector('#prev').onclick=()=>advance(-1);document.querySelector('#clear').onclick=async()=>{if(!list().length||!confirm('Clear initiative?'))return;await OBR.scene.items.updateItems(i=>i.metadata?.[IK]!==undefined,a=>a.forEach(i=>delete i.metadata[IK]));turn={currentId:null,round:1};await save();render()};
async function menu(){
  await OBR.contextMenu.create({
    id:ID+'/context',
    icons:[
      {icon:'/add.svg',label:'Add to Initiative',filter:{every:[{key:'layer',value:'CHARACTER'}]}},
      {icon:'/remove.svg',label:'Remove from Initiative',filter:{every:[{key:'layer',value:'CHARACTER'}]}}
    ],
    onClick:async(c,elementId)=>{
      const a=c.items||[];
      if(!a.length)return;
      if(elementId===ID+'/context/remove'){
        await OBR.scene.items.updateItems(a,x=>x.forEach(i=>delete i.metadata[IK]));
        if(a.some(i=>i.id===turn.currentId)){
          turn.currentId=null;
          await save();
        }
        render();
        return;
      }
      const v=prompt('Initiative:','10');
      if(v===null)return;
      const n=Number(v);
      if(!Number.isFinite(n))return;
      await OBR.scene.items.updateItems(a,x=>x.forEach(i=>i.metadata[IK]=n));
      if(!turn.currentId&&a[0]){turn.currentId=a[0].id;await save();}
      render();
    }
  });
}
OBR.onReady(async()=>{const m=await OBR.room.getMetadata();if(m?.[TK])turn={...turn,...m[TK]};await menu();OBR.scene.items.onChange(x=>{items=x;render()});OBR.room.onMetadataChange(m=>{if(m?.[TK]){turn={...turn,...m[TK]};render()}});items=await OBR.scene.items.getItems();render()});
