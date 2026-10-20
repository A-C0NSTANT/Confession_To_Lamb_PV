import {Application,Assets,Graphics} from '../vendor/pixi.mjs';
import {createTriptych} from './triptych.mjs';
import {createSpin} from './spin.mjs';
import {createLoading} from './loading.mjs';

const data=await fetch('/assets/scene.json').then(r=>r.json()),app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async(file,nearest=false)=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode=nearest?'nearest':'linear';return t;};
const triptych=await createTriptych(data,load),spin=await createSpin(data,load),loading=await createLoading(data,load);
const flash=new Graphics().rect(0,0,data.width,data.height).fill(0xffffff);
app.stage.addChild(triptych.root,spin.root,loading.root,flash);
window.renderFrame=async(n,stage=4)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  triptych.root.visible=n<data.cuts.spin;spin.root.visible=n>=data.cuts.spin&&n<data.cuts.loading;
  loading.root.visible=n>=data.cuts.loading&&n<data.cuts.flash;flash.visible=n===data.cuts.flash;
  if(triptych.root.visible)triptych.update(n,stage);
  if(spin.root.visible)spin.update(n,stage);
  if(loading.root.visible)loading.update(n);
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
