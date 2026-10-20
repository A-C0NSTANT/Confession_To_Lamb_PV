import {Container,Sprite,Texture,Rectangle} from '../vendor/pixi.mjs';

export async function createDialogue(data,load){
  const root=new Container(),atlas=await load('text.png'),captions=[];
  function text(d){const sprite=new Sprite(new Texture({source:atlas.source,frame:new Rectangle(...d.rect)}));sprite.position.set(d.x,d.y);root.addChild(sprite);return sprite;}
  for(const d of data.text)text(d);
  const p=data.pointer,pointer=new Sprite(await load(p.file));pointer.position.set(p.x,p.y);root.addChild(pointer);
  for(const d of data.captions)captions.push({d,sprite:text(d)});
  function update(n){
    pointer.y=p.y+data.cursor[n];
    for(const {d,sprite} of captions){
      const e=d.exposures.find(e=>n>=e.start&&n<e.end),p=e?.track[n-e.start];sprite.visible=!!p;sprite.position.set(d.x,d.y+(p?.y??0));
    }
  }
  return {root,update};
}
