const data=await fetch('/assets/events.json').then(r=>r.json());
const canvas=document.createElement('canvas');canvas.width=data.width;canvas.height=data.height;document.body.append(canvas);
const context=canvas.getContext('2d',{alpha:true});
const images=new Map();
const cache=new Map();
await Promise.all(data.events.map(async e=>{const image=new Image();image.src='/assets/'+e.file;await image.decode();images.set(e.id,image);}));
function rigState(e,n){
 const rig=data.rigs[e.rig];if(!rig)return {alpha:1};
 const local=n-rig.start,fx=rig.effects?.[local]??{};
 const alpha=Math.max(0,1-(rig.white?.[local]??fx.white??0))*(1-(fx.black??0));
 return {alpha,hud:e.hud?rig.hud?.[local]:null};
}
window.renderFrame=async n=>{
 if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid output frame '+n);
 const active=data.events.filter(e=>n>=e.start&&n<e.end);
 const key=JSON.stringify(active.map(e=>[e.id,rigState(e,n),e.typing?.[String(e.sourceStart+n-e.start)]??null]));
 if(cache.has(key))return cache.get(key);
 context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,canvas.width,canvas.height);
 for(const e of active){
  if(n<e.start||n>=e.end)continue;
  const image=images.get(e.id),rig=rigState(e,n);if(rig.alpha<=0)continue;
  context.save();context.globalAlpha=rig.alpha;context.imageSmoothingEnabled=e.style!=='pixel'&&e.style!=='pink';
  if(rig.hud){const p=rig.hud;context.translate(p.x,p.y);context.rotate(p.angle??0);context.scale(p.scale??1,p.scale??1);}
  if(e.typing){
   const sourceFrame=e.sourceStart+n-e.start;
   const tracks=e.typing[String(sourceFrame)];
   if(tracks){
    e.glyphs.forEach((glyph,j)=>{
     const p=tracks[j];if(!p?.[0])return;
     const [sx,sy,w,h]=glyph.rect;
     const y=p[1]+(e.alignedTypewriterBaseline?(glyph.baselineOffset??0):0);
     context.drawImage(image,sx,sy,w,h,glyph.x*1.5,y*1.5,w*1.5,h*1.5);
    });
   }
  }else{
   context.drawImage(image,e.x,e.y,e.width,e.height);
  }
  context.restore();
 }
 const encoded=canvas.toDataURL('image/png').split(',')[1];
 cache.set(key,encoded);if(cache.size>512)cache.delete(cache.keys().next().value);
 return encoded;
};
window.subtitleData=data;window.ready=true;
