import {Container,Sprite,Graphics,Texture,Rectangle} from '../vendor/pixi.mjs';
import {createCharacterRig} from './character-rig.mjs';

export function setPose(node,p){node.position.set(p.x,p.y);node.scale.set(p.scale);node.rotation=p.angle;}
export async function createBattle(data,portrait,layerAnimation,rig,layerMode,load){
  const root=new Container(),background=new Container(),backgroundPlate=new Sprite(await load('background.png'));
  setPose(backgroundPlate,data.backgroundPlacement);background.addChild(backgroundPlate);
  const actor=new Container(),character=await createCharacterRig(rig,portrait,layerAnimation.parameters,load);actor.addChild(character.root);
  const crop=new Graphics();actor.addChild(crop);actor.mask=crop;
  const hud=new Container(),labels=[],atlas=await load('hud-text.png');
  for(const box of data.boxes)hud.addChild(new Graphics().rect(box.x,box.y,box.width,box.height).fill({color:0x000000,alpha:box.fill}));
  hud.addChild(new Sprite(await load('hud-borders.png')));
  for(const d of data.text){
    const plate=new Sprite(new Texture({source:atlas.source,frame:new Rectangle(...d.rect)}));plate.position.set(d.x,d.y);hud.addChild(plate);labels.push({d,plate});
  }
  root.addChild(background,actor,hud);
  function update(n,stage){
    const mode=!layerAnimation.enabled?'off':layerMode;
    const p=(mode==='on'?layerAnimation.rootPoses:layerAnimation.sourcePoses)[n],calibration=portrait[p.kind==='laugh'?'laugh':'float'];
    setPose(background,data.tracks.background[n]);setPose(hud,data.tracks.hud[n]);
    actor.pivot.set(...p.pivot);actor.position.set(p.x+calibration.offsetX,p.y+calibration.offsetY);actor.scale.set(p.scale*calibration.scaleMultiplier);actor.rotation=p.angle;
    character.update(p.kind,layerAnimation.parts[n],mode);
    crop.clear().rect(-512,-512,2048,calibration.cropBottom+512).fill(0xffffff);
    for(const {d,plate} of labels)plate.visible=!d.english||data.english[n];
  }
  return {root,background,actor,hud,character,update};
}
