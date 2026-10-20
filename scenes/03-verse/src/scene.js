import {Application,Assets,Container,Sprite,Texture,Rectangle} from '../vendor/pixi.mjs';
import {createExpressionRig} from './expression.mjs';
const data=await fetch('/assets/scene.json').then(r=>r.json());
const expressionData=await fetch('/assets/expression.json').then(r=>r.json());
const app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,autoDensity:false,background:0x000000,
  antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async(file,nearest=false)=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode=nearest?'nearest':'linear';return t;};
const background=new Sprite(await load('flat-source.png'));
const main=new Container(),words=new Container(),small=new Container(),menu=new Container();
app.stage.addChild(background,main,words,small,menu);
const character=createExpressionRig({original:await load('book.png'),clean:await load('book-mouth-clean.png'),
  closedEyes:await load(expressionData.eyePatch.file),config:expressionData,
  enabled:new URLSearchParams(location.search).get('expressions')!=='off'});
const book=character.root,sticker=new Sprite(await load('small-sticker.png'));
const p=data.placement.main,q=data.placement.small;
book.scale.set(p.scale);book.position.set(p.x,p.y);main.addChild(book);
sticker.scale.set(q.scale);sticker.position.set(q.x-q.padding*q.scale,q.y-q.padding*q.scale);small.addChild(sticker);
menu.addChild(new Sprite(await load(data.menu.file,true)));
const pointer=new Sprite(await load(data.menu.pointer,true));pointer.position.set(data.menu.x,data.menu.y);menu.addChild(pointer);
const glyphs=[];
if(data.lyrics.length){
  const atlas=await load('lyrics.png');
  const shadows=new Container(),faces=new Container();words.addChild(shadows,faces);
  for(const description of data.lyrics){
    const pair=[];
    for(const part of ['shadow','face']){
      const sprite=new Sprite(new Texture({source:atlas.source,frame:new Rectangle(...description[part])}));
      sprite.tint=part==='face'?description.color:description.shadowColor;
      sprite.position.set(description.x,description.y);(part==='face'?faces:shadows).addChild(sprite);pair.push(sprite);
    }
    glyphs.push({description,pair});
  }
}
function pose(group,state){group.scale.set(state.scale);group.position.set(state.x,state.y);}
window.renderFrame=async(n,stage=3)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  const isScene=n>=data.sceneStart;background.visible=main.visible=isScene;menu.visible=!isScene;
  pose(main,data.main[n]);small.visible=isScene&&data.small[n]!==null;
  character.update(n);
  if(data.small[n])pose(small,data.small[n]);
  if(!isScene){const y=data.menu.frames[n];pointer.visible=y!==null;pointer.y=data.menu.y+(y||0);}
  words.visible=isScene&&stage>=2;
  for(const {description:d,pair} of glyphs){
    const visible=n>=d.start&&n<d.end,track=d.track?.[n-d.start]||[0,0];
    for(const sprite of pair){sprite.visible=visible;sprite.position.set(d.x+track[0],d.y+track[1]);}
  }
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);
  return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
