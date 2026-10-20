import {Container,Sprite,Texture,Rectangle} from '../vendor/pixi.mjs';

export async function createTextAtlas(file,descriptions,load,parent){
  const atlas=await load(file),shadows=new Container(),faces=new Container();parent.addChild(shadows,faces);
  const result=[];
  for(const d of descriptions){
    const sprites=[];
    for(const key of ['shadow','face']){
      if(!d[key])continue;
      const sprite=new Sprite(new Texture({source:atlas.source,frame:new Rectangle(...d[key])}));
      sprite.tint=key==='shadow'?(d.shadowColor??0):(d.color??0xffffff);
      (key==='shadow'?shadows:faces).addChild(sprite);sprites.push(sprite);
    }
    result.push({d,sprites});
  }
  return result;
}

export function updateCaptions(items,n){
  for(const {d,sprites} of items){
    const p=n>=d.start&&n<d.end?d.track[n-d.start]:null;
    for(const sprite of sprites){sprite.visible=!!p;sprite.position.set(d.x,d.y+(p?.y??0));sprite.alpha=p?.alpha??0;}
  }
}
