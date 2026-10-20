import {Application,Assets,Container,Sprite} from '../vendor/pixi.mjs';
import {createFollowers} from './followers.mjs';
import {createChannelShift} from './effects.mjs';

const data=await fetch('/assets/scene.json').then(r=>r.json()),app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async(file,nearest=false)=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode=nearest?'nearest':'linear';return t;};
const background=new Container(),foreground=new Container(),words=new Container(),hands=new Container(),modes={};
for(const mode of ['day','night']){
  const bg=new Sprite(await load(`background-${mode}.png`)),fg=new Sprite(await load(`foreground-${mode}.png`)),d=data.ui[mode],text=new Sprite(await load(d.file));text.position.set(d.x,d.y);
  background.addChild(bg);foreground.addChild(fg);words.addChild(text);modes[mode]={bg,fg,text};
}
const actors=createFollowers(data,await load('followers.png',true));
const handSprites=[];
for(const file of data.hands.files){const sprite=new Sprite(await load(file));sprite.position.set(data.hands.x,data.hands.y);hands.addChild(sprite);handSprites.push(sprite);}
app.stage.addChild(background,actors.root,foreground,hands,words);
const channelShift=createChannelShift(data.width,data.height);
window.renderFrame=async(n,stage=4)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  const p=data.states[n];
  for(const [mode,group] of Object.entries(modes)){const active=(mode==='night')===p.night;group.bg.visible=group.fg.visible=active;group.text.visible=active&&stage>=2;}
  actors.root.visible=stage>=2;actors.update(p.layout);hands.visible=p.night&&stage>=3;
  for(let i=0;i<handSprites.length;i++)handSprites[i].visible=p.hand===i;
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);
  const canvas=stage>=4&&p.fx!==null?channelShift(app.canvas,data.effects[p.fx].offsets):app.canvas;
  return canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
