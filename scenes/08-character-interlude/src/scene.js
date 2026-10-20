import {Application,Assets,Container,Sprite,Graphics,Rectangle} from '../vendor/pixi.mjs';
import {createLyrics} from './lyrics.mjs';
import {createTreatment} from './effects.mjs';

const [data,snow]=await Promise.all(['scene.json','snow.json'].map(file=>fetch('/assets/'+file).then(r=>r.json()))),app=new Application();
await app.init({width:data.width,height:data.height,resolution:1,background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);app.canvas.style.cssText='display:block;width:1920px;height:1080px';app.stop();
const load=async(file)=>{const t=await Assets.load('/assets/'+file);t.source.scaleMode='linear';return t;};
const cgScene=new Container(),cgPlates=[];
for(let i=0;i<3;i++){
  const sprite=new Sprite(await load(`cg-${i}.png`)),scale=Math.max(1920/sprite.texture.width,1080/sprite.texture.height);sprite.scale.set(scale);cgScene.addChild(sprite);cgPlates.push({sprite,x:(1920-sprite.texture.width*scale)/2,y:(1080-sprite.texture.height*scale)/2});
}
const menu=new Sprite(await load('menu.png')),pointer=new Sprite(await load('menu-pointer.png'));cgScene.addChild(menu,pointer);
const main=new Container(),background=new Sprite(await load('flat-source.png')),characterRoot=new Container(),character=new Sprite(await load('narinder.png'));
character.scale.set(data.placement.scale);character.position.set(data.placement.x,data.placement.y);characterRoot.addChild(character);
const lyrics=createLyrics(data,await load('lyrics.png')),brightening=new Graphics().rect(0,0,1920,1080).fill(0xffffff);
main.addChild(background,characterRoot,lyrics.root,brightening);main.filterArea=new Rectangle(0,0,1920,1080);
const treatment=createTreatment(data,snow),finalWhite=new Graphics().rect(0,0,1920,1080).fill(0xffffff);app.stage.addChild(cgScene,main,finalWhite);
window.renderFrame=async(n,stage=4)=>{
  if(!Number.isInteger(n)||n<0||n>=data.frames)throw new Error('Invalid frame');
  cgScene.visible=n<data.cuts.black;main.visible=n>=data.cuts.main&&n<data.cuts.white;finalWhite.visible=n===data.cuts.white;
  if(cgScene.visible){
    const p=data.cg[n];for(let i=0;i<cgPlates.length;i++){const d=cgPlates[i];d.sprite.visible=i===p.image;d.sprite.position.set(d.x+p.x,d.y+p.y);}
    menu.visible=stage>=2&&n<17;menu.alpha=data.menu.frames[n]??0;
    pointer.visible=menu.visible;pointer.alpha=menu.alpha;
    pointer.position.set(data.menu.pointer.x,data.menu.pointer.y+(p.image===1?data.menu.pointer.rowOffset:0));
  }
  if(main.visible){
    const p=data.actor[n],shot=data.shots[String(p.reference)];characterRoot.scale.set(shot.scale*p.scale);characterRoot.position.set(shot.x+p.x,shot.y+p.y);
    lyrics.root.visible=stage>=2;lyrics.update(n);brightening.visible=stage>=3;brightening.alpha=data.effects.frames[n].white;
    main.filters=stage>=3?[treatment.filter]:[];treatment.update(n,stage);
  }
  if(app.stage.renderGroup)app.stage.renderGroup.structureDidChange=true;
  app.renderer.render(app.stage);return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
