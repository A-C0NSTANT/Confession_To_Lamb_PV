import {Container,Sprite} from '../vendor/pixi.mjs';
import {pose} from './poses.mjs';

export async function createStickers(data,load){
  const root=new Container(),texture=await load('small-sticker.png'),copies=[];
  for(const d of data.sticker.copies){const group=new Container(),actor=new Sprite(texture);pose(actor,data.materials.sticker);group.addChild(actor);root.addChild(group);copies.push({d,group});}
  return {root,update(n){for(const {d,group} of copies){const p=d.track[n];group.visible=!!p;if(p)pose(group,p);}}};
}
export async function createPoster(data,load){
  const root=new Container();
  const portrait=new Sprite(await load('lamb-evil.png'));
  pose(portrait,data.materials.evil);root.addChild(portrait);
  return {root,update(n){pose(root,data.tracks.poster[n]);}};
}
