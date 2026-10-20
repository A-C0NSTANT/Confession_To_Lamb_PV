import {Application,Assets,Container,Graphics,Rectangle} from '../vendor/pixi.mjs';
import {createDeclaration} from './declaration.mjs';
import {createChurch} from './church.mjs';
import {createStickers,createPoster} from './characters.mjs';
import {createFinale} from './finale.mjs';
import {createEffects} from './effects.mjs';

const data=await fetch('/assets/scene.json').then(r=>r.json()),app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async file=>{const texture=await Assets.load('/assets/'+file);texture.source.scaleMode='linear';return texture;};
const world=new Container(),declaration=await createDeclaration(data,load),church=await createChurch(data,load),stickers=await createStickers(data,load),poster=await createPoster(data,load),finale=await createFinale(data,load),effects=createEffects(data.effects.parameters);
world.addChild(declaration.root,church.root,stickers.root,poster.root);world.filterArea=new Rectangle(0,0,1920,1080);
const white=new Graphics().rect(0,0,1920,1080).fill(0xffffff);app.stage.addChild(world,finale.root,white);
window.renderFrame=async(n,stage=4)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  world.visible=n<318;declaration.root.visible=n<74;church.root.visible=n>=74&&n<318;stickers.root.visible=n>=142&&n<214;poster.root.visible=n>=214&&n<286;finale.root.visible=n>=318;
  if(declaration.root.visible)declaration.update(n);if(church.root.visible)church.update(n);if(stickers.root.visible)stickers.update(n);if(poster.root.visible)poster.update(n);if(finale.root.visible)finale.update(n,stage);
  const p=data.effects.frames[n];effects.update(n,p);world.filters=stage>=4&&(p.blocks||p.r.some(Boolean)||p.b.some(Boolean))?[effects.filter]:[];white.alpha=stage>=4?p.white:0;
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
