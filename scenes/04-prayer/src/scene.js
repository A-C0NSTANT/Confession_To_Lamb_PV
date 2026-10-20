import {Application,Assets,Container,Sprite,Texture,Rectangle,Graphics} from '../vendor/pixi.mjs';
import {createSpeaker} from './speaker.mjs';
const data=await fetch('/assets/scene.json').then(r=>r.json()),app=new Application();
await app.init({width:1920,height:1080,resolution:1,autoDensity:false,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async(file,nearest=false)=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode=nearest?'nearest':'linear';return t;};
const background=new Sprite(await load('flat-source.png')),main=new Container(),words=new Container();
const profile=new Sprite(await load('profile.png'));const mp=data.placement.main;
profile.scale.set(mp.scale);profile.position.set(mp.x,mp.y);main.addChild(profile);
const grid=new Sprite(await load('grid.png',true)),dialogue=new Container(),speakerLayer=new Container();
const rig=createSpeaker({body:await load('speaker-body.png'),faces:Object.fromEntries(await Promise.all(['calm','open','smile'].map(async k=>[k,await load(`speaker-${k}.png`)]))),placement:data.placement.face});
const sp=data.placement.speaker;rig.root.scale.set(sp.scale);rig.root.position.set(sp.x,sp.y);speakerLayer.addChild(rig.root);
const fade=new Graphics().rect(0,0,1920,1080).fill(0x000000),previous=new Sprite(await load('previous-end.png'));
app.stage.addChild(background,main,words,grid,dialogue,speakerLayer,fade,previous);
const b=data.effects.border,border=new Graphics().rect(b.x,b.y,b.width,b.height).stroke({width:b.thickness,color:0xffffff});dialogue.addChild(border);
const glyphs=[],captions=[];
async function makeText(file,descriptions,parent,destination){
  const atlas=await load(file),shadows=new Container(),faces=new Container();parent.addChild(shadows,faces);
  for(const d of descriptions){
    const pair=[];
    for(const part of ['shadow','face']){
      const sprite=new Sprite(new Texture({source:atlas.source,frame:new Rectangle(...d[part])}));sprite.tint=part==='face'?(d.color??0xffffff):(d.shadowColor??0);(part==='face'?faces:shadows).addChild(sprite);pair.push(sprite);
    }
    destination.push({d,pair});
  }
}
await makeText('lyrics.png',data.lyrics,words,glyphs);await makeText('dialogue.png',data.effects.dialogue,dialogue,captions);
const animated=new URLSearchParams(location.search).get('expressions')!=='off';
function pose(group,p){if(p){group.scale.set(p.scale);group.position.set(p.x,p.y);}}
window.renderFrame=async(n,stage=4)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  previous.visible=n===0;const active=n>0;
  background.visible=main.visible=active;pose(background,data.background[n]);pose(main,data.main[n]);
  words.visible=active&&stage>=2;pose(words,data.background[n]);
  for(const {d,pair} of glyphs){
    const e=d.exposures.find(e=>e.start<=n&&n<e.end),track=e?.track[n-e.start]??[0,0];
    for(const sprite of pair){sprite.visible=!!e;sprite.position.set(d.x+track[0],d.y+track[1]);}
  }
  const effect=data.effects.frames[n],later=active&&stage>=3;
  grid.visible=later;grid.alpha=effect.grid;dialogue.visible=later;border.alpha=effect.panel;
  for(const {d,pair} of captions){
    const state=n>=d.start&&n<d.end?d.track[n-d.start]:null;
    for(const sprite of pair){sprite.visible=!!state;sprite.position.set(d.x,d.y+(state?.y??0));sprite.alpha=state?.alpha??0;}
  }
  speakerLayer.visible=later&&data.speaker[n]!==null;pose(speakerLayer,data.speaker[n]);rig.update(stage>=4&&animated?data.expressions[n]:'calm');
  fade.visible=later;fade.alpha=1-effect.fade;
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
