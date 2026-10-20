import {Application,Assets,Container,Sprite,Graphics,Rectangle} from '../vendor/pixi.mjs';
import {createCharacter} from './character.mjs';
import {createDialogue} from './dialogue.mjs';
import {createEffects} from './effects.mjs';

const [data,rig,parameters]=await Promise.all(['scene.json','rig.json','effects.json'].map(file=>fetch('/assets/'+file).then(r=>r.json())));
const app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async file=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode='linear';return t;};
const main=new Container(),background=new Sprite(await load('church.png')),actorLayer=new Container(),character=await createCharacter(rig,load),dialogue=await createDialogue(data,load);
actorLayer.addChild(character.root);actorLayer.filterArea=new Rectangle(0,0,1920,1080);
main.addChild(background,actorLayer);
for(const box of data.boxes)main.addChild(new Graphics().rect(box.x,box.y,box.width,box.height).fill({color:0x000000,alpha:box.fill}));
main.addChild(new Sprite(await load('borders.png')),dialogue.root);main.filterArea=new Rectangle(0,0,1920,1080);
const effects=createEffects(parameters);actorLayer.filters=[effects.tone];
const white=new Graphics().rect(0,0,1920,1080).fill(0xffffff),black=new Graphics().rect(0,0,1920,1080).fill(0x000000),gameOver=new Sprite(await load('game-over.png'));
app.stage.addChild(main,white,black,gameOver);
const expressions=new URLSearchParams(location.search).get('expressions')!=='off';
window.renderFrame=async(n,stage=4)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  const active=n<data.gameOver,frame=data.effects[n];main.visible=active;gameOver.visible=!active;
  white.visible=black.visible=active&&stage>=4;white.alpha=frame.white;black.alpha=frame.black;
  if(active){
    character.update(data.rigMotion[n],stage>=3&&expressions?data.expressions[n]:{eyes:'closed',mouth:'smile'},stage>=2);
    dialogue.update(n);effects.update(n,frame);
    main.filters=stage>=4&&(frame.tear>0||frame.r.some(Boolean)||frame.b.some(Boolean))?[effects.glitch]:[];
  }
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
