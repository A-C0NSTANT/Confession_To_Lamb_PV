import {Application,Assets,Container,Graphics,Rectangle} from '../vendor/pixi.mjs';
import {createBattle} from './battle.mjs';
import {createScreenTear} from './screen-tear.mjs';
import {createEffects} from './effects.mjs';
import {createActorAnimation} from './actor-animation.mjs';
import {createLayerAnimation} from './layer-animation.mjs';

const files=['scene.json','effects.json','portrait.json','animation.json','rig.json','animation-parts/root-motion.json','animation-parts/head.json','animation-parts/body.json','animation-parts/left-arm.json','animation-parts/right-arm.json'];
const [data,parameters,portrait,animation,rig,rootMotion,head,body,leftArm,rightArm]=await Promise.all(files.map(file=>fetch('/assets/'+file).then(r=>r.json())));
const actorPoses=createActorAnimation(data,animation);
const layerAnimation=createLayerAnimation(data,animation,portrait,actorPoses,{root:rootMotion,head,body,leftArm,rightArm});
const layerMode=new URLSearchParams(location.search).get('layers')||'on';
const app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async file=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode='linear';return t;};
const world=new Container(),battle=await createBattle(data,portrait,layerAnimation,rig,layerMode,load),tear=await createScreenTear(data,parameters,load),effects=createEffects(parameters);
world.addChild(tear.root,battle.root);world.filterArea=new Rectangle(0,0,1920,1080);
const black=new Graphics().rect(0,0,1920,1080).fill(0x000000);app.stage.addChild(world,black);
window.renderFrame=async(n,stage=4)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  const active=n<data.cuts.black,p=data.effects[n];world.visible=active;black.visible=!active;
  if(active){
    tear.root.visible=n<data.cuts.battle;battle.root.visible=!tear.root.visible;
    if(tear.root.visible)tear.update(n);else battle.update(n,stage);
    effects.update(n,p);world.filters=stage>=4&&(p.blocks||p.r.some(Boolean)||p.b.some(Boolean))?[effects.filter]:[];
  }
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
