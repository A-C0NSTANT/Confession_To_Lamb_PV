import {Application,Assets,Graphics} from '../vendor/pixi.mjs';
import {createChant} from './chant.mjs';
import {createTriptych} from './triptych.mjs';
import {createSpin} from './spin.mjs';
import {createGlitch} from './glitch.mjs';

const data=await fetch('/assets/scene.json').then(r=>r.json()),app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async(file,nearest=false)=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode=nearest?'nearest':'linear';return t;};
const chant=await createChant(data,load),cards=await createTriptych(data,load),spin=await createSpin(data,load);
const black=new Graphics().rect(0,0,1920,1080).fill(0x000000),white=new Graphics().rect(0,0,1920,1080).fill(0xffffff);
app.stage.addChild(chant.root,cards.root,spin.root,black,white);
const expressions=new URLSearchParams(location.search).get('expressions')!=='off';
const glitch=createGlitch(data.glitch,data.width,data.height);
function draw(n,stage){
  chant.root.visible=n<data.cuts.cards;cards.root.visible=n>=data.cuts.cards&&n<data.cuts.spin;spin.root.visible=n>=data.cuts.spin;
  if(chant.root.visible)chant.update(n,stage,expressions);if(cards.root.visible)cards.update(n,stage);if(spin.root.visible)spin.update(n);
  const fx=data.effects.frames[n];black.alpha=stage>=3?fx.black:0;white.alpha=stage>=3?fx.white:0;
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);
}
window.renderFrame=async(n,stage=4)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  const active=stage>=4&&n>=data.glitch.start&&n<data.glitch.end;
  if(active&&!glitch.ready){draw(data.glitch.reference,stage);glitch.capture(app.canvas);}
  draw(n,stage);
  const canvas=active?glitch.apply(app.canvas,n,data.tracks.spin[n].scale/data.tracks.spin[data.glitch.reference].scale):app.canvas;
  return canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
