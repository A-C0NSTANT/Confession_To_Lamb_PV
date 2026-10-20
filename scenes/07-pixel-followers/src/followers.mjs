import {Container,Sprite,Texture,Rectangle} from '../vendor/pixi.mjs';

export function createFollowers(data,atlas){
  const root=new Container(),sprites=[];
  const textures=Object.fromEntries(data.sprites.map(d=>[d.id,new Texture({source:atlas.source,frame:new Rectangle(...d.rect)})]));
  const stations=Object.fromEntries(data.stations.map(d=>[d.id,d]));
  for(let i=0;i<3;i++){const sprite=new Sprite(textures['fox-stop']);sprite.pivot.set(32,76);root.addChild(sprite);sprites.push(sprite);}
  return {root,update(id){
    const layout=data.layouts[id];
    for(let i=0;i<sprites.length;i++){
      const sprite=sprites[i],a=layout[i];sprite.visible=!!a;if(!a)continue;
      const p=stations[a.station];sprite.texture=textures[`${a.kind}-${p.pose}`];sprite.scale.set(data.scale*(p.direction===-1?1:-1),data.scale);sprite.position.set(p.x+(a.dx??0),p.y);
    }
  }};
}
