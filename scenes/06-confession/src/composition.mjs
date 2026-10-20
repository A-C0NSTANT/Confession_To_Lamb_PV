import {Container,Sprite,Graphics} from '../vendor/pixi.mjs';
import {createCharacter} from './character.mjs';

export async function createComposition(data,load){
  const root=new Container(),background=new Sprite(await load('church.png'));
  const rig=await fetch('/assets/rig.json').then(r=>r.json()),character=await createCharacter(rig,load);
  root.addChild(background,character.root);
  for(const b of data.boxes)root.addChild(new Graphics().rect(b.x,b.y,b.width,b.height).fill({color:0x000000,alpha:b.fill}));
  root.addChild(new Sprite(await load('borders.png')));
  const expressions=new URLSearchParams(location.search).get('expressions')!=='off';
  return {root,character,update(n,stage){character.update(data.rigMotion[n],expressions?data.expressions[n]:{eyes:'closed',mouth:'closed'},stage>=2);}};
}
