import {Application,Assets,Container,Sprite,Graphics,Matrix,Texture} from '../vendor/pixi.mjs';
import {createCharacterRig} from './character-rig.mjs';
import {characterPose} from './character-animation.mjs';
const data=await fetch('/assets/scene.json').then(r=>r.json());
const [rigData,characterCurves]=await Promise.all(['character-rig.json','character-animation.json'].map(file=>fetch('/assets/'+file).then(r=>r.json())));
const options=new URLSearchParams(location.search);
const characterOptions={arm:options.get('arm')!=='off',blink:options.get('blink')!=='off'};
const app=new Application();
await app.init({width:1920,height:1080,resolution:1,autoDensity:false,background:0x676767,
  antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();

const backgroundCanvas=document.createElement('canvas');backgroundCanvas.width=1920;backgroundCanvas.height=1;
const context=backgroundCanvas.getContext('2d'),row=context.createImageData(1920,1);
const backgroundTexture=Texture.from(backgroundCanvas);backgroundTexture.source.scaleMode='nearest';
const backgroundSprite=new Sprite(backgroundTexture);backgroundSprite.height=1080;app.stage.addChild(backgroundSprite);
const camera=new Container(),actor=new Container(),titles=new Container(),credits=new Container();
app.stage.addChild(camera,credits);camera.addChild(actor,titles);
const actorTexture=await Assets.load('/assets/'+data.actorFile);actorTexture.source.scaleMode='linear';
const lids=await Assets.load('/assets/'+rigData.eye.file);
const characterRig=createCharacterRig(actorTexture,rigData,lids),character=characterRig.root;actor.addChild(character);
const [p,q]=data.actorPlacement;character.setFromMatrix(new Matrix(p[0],q[0],p[1],q[1],p[2],q[2]));
const silhouetteTexture=await Assets.load('/assets/reach-silhouette.png');silhouetteTexture.source.scaleMode='linear';
const silhouette=new Sprite(silhouetteTexture);silhouette.tint=0x676767;
silhouette.setFromMatrix(new Matrix(p[0],q[0],p[1],q[1],p[2],q[2]));actor.addChild(silhouette);
const titleObjects={};
for(const name of ['upper','lower']){
  const desc=data.materials[name],group=new Container();titles.addChild(group);
  for(const part of ['shadow','face']){
    const texture=await Assets.load(`/assets/${name}-${part}.png`);texture.source.scaleMode='linear';
    const sprite=new Sprite(texture);sprite.position.set(desc.x,desc.y);
    const c=desc[part+'Color'];sprite.tint=(c<<16)|(c<<8)|c;group.addChild(sprite);
  }
  titleObjects[name]=group;
}
// The first exposed title frame has its own clipped glyph state in the source.
const entry=new Container();app.stage.addChild(entry);
for(const part of ['shadow','face']){
  const texture=await Assets.load(`/assets/upper-entry-${part}.png`);texture.source.scaleMode='linear';
  const sprite=new Sprite(texture);sprite.position.set(data.upperEntry.x,data.upperEntry.y);sprite.tint=part==='face'?0xffffff:0x000000;entry.addChild(sprite);
}
const creditObjects={};
for(const name of ['music','music-name','movie','movie-name','english','enjoy']){
  const desc=data.materials[name],texture=await Assets.load('/assets/'+name+'.png');texture.source.scaleMode='linear';
  const group=new Container(),sprite=new Sprite(texture);sprite.position.set(desc.x,desc.y);group.addChild(sprite);credits.addChild(group);
  creditObjects[name]=group;
}
const flash=new Graphics().rect(0,0,1920,1080).fill(0xffffff);app.stage.addChild(flash);
const endPose=data.camera[140],infoStart=data.creditsCamera[0];
function pose(group,state){group.scale.set(state.scale);group.position.set(state.x,state.y);}
function paintBackground(edge){
  const {dark,light,bandWidth,gap,edgeSoftness}=data.backgroundStyle;
  const left=edge-bandWidth-gap,bandLeft=edge-bandWidth;
  const falling=(x,b)=>Math.max(0,Math.min(1,(b-x)/edgeSoftness+.5));
  for(let x=0;x<1920;x++){
    const px=x+.5,coverage=Math.max(falling(px,left),falling(px,edge)-falling(px,bandLeft));
    const v=Math.round(light+(dark-light)*coverage),i=x*4;row.data[i]=row.data[i+1]=row.data[i+2]=v;row.data[i+3]=255;
  }
  context.putImageData(row,0,0);backgroundTexture.source.update();
}
window.renderFrame=async(n,stage=3)=>{
  if(!Number.isInteger(n)||n<0||n>=245)throw new Error('Invalid frame');
  const state=data.background[n];paintBackground(state.edge);
  const info=n>=data.cut;camera.visible=true;titles.visible=!info;credits.visible=info;
  character.visible=!info;silhouette.visible=info;
  characterRig.update(characterPose(characterCurves,n,characterOptions));
  if(!info){
    const c=data.camera[n];pose(camera,c);
    titleObjects.upper.y=c.upper;titleObjects.lower.y=c.lower;
    titleObjects.upper.visible=n>data.upperEntry.frame;titleObjects.lower.visible=n>=38;
  }else{
    const c=data.creditsCamera[n-data.cut];
    const ratio=c.scale/infoStart.scale;
    pose(camera,{scale:endPose.scale*ratio,x:c.x+(endPose.x-infoStart.x)*ratio,y:c.y+(endPose.y-infoStart.y)*ratio});
  }
  entry.visible=!info&&n===data.upperEntry.frame;
  for(const [name,g] of Object.entries(creditObjects)){
    const desc=data.materials[name],c=data.creditsCamera[Math.max(0,n-data.cut)];
    const reference=data.creditsCamera[desc.reference-data.cut];
    const ratio=c.scale/reference.scale;
    pose(g,{scale:ratio,x:c.x-reference.x*ratio,y:c.y-reference.y*ratio});
    g.visible=name==='english'||((name==='music'||name==='music-name')&&n<data.creditsEvents.movie)||((name==='movie'||name==='movie-name')&&n>=data.creditsEvents.movie)||(name==='enjoy'&&n>=data.creditsEvents.enjoy);
  }
  flash.alpha=stage>=3?state.flash:0;
  // Each offline frame is independently evaluated, including changes in masks.
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);
  return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
