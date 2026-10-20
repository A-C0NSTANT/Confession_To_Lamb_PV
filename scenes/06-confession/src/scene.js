import {Application,Assets,Graphics} from '../vendor/pixi.mjs';
import {createComposition} from './composition.mjs';
import {createDialogue} from './dialogue.mjs';
const data=await fetch('/assets/scene.json').then(r=>r.json()),app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async(file)=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode='linear';return t;};
const composition=await createComposition(data,load),dialogue=await createDialogue(data,load);
const white=new Graphics().rect(0,0,data.width,data.height).fill(0xffffff),gray=new Graphics().rect(0,0,data.width,data.height).fill(0x808080);
app.stage.addChild(composition.root,dialogue.root,white,gray);
window.renderFrame=async(n,stage=3)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  const main=n<data.flashStart;composition.root.visible=main;dialogue.root.visible=main;
  white.visible=main;white.alpha=main?data.white[n]:0;gray.visible=!main&&((n-data.flashStart)%2===0);
  if(main){composition.update(n,stage);dialogue.update(n);}
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
