import {Container,Sprite,Graphics} from '../vendor/pixi.mjs';

export async function createSpin(data,load){
  const root=new Container(),gray=data.spin.background;root.addChild(new Graphics().rect(0,0,1920,1080).fill(gray*0x010101));
  const world=new Container();world.pivot.set(960,540);world.position.set(960,540);root.addChild(world);
  for(const file of ['emblem.png','braid.png','rings.png']){const sprite=new Sprite(await load(file));sprite.anchor.set(.5);sprite.position.set(960,540);world.addChild(sprite);}
  const ornaments=new Sprite(await load('ornaments.png'));ornaments.anchor.set(.5);ornaments.position.set(960,540);world.addChild(ornaments);
  const d=data.characters.floating,actor=new Sprite(await load(d.file));actor.pivot.set(...d.anchor);actor.position.set(960,540);actor.scale.set(d.scale);world.addChild(actor);
  const columns=[];
  for(const d of data.spin.columns){const sprite=new Sprite(await load(d.file));root.addChild(sprite);columns.push({d,sprite});}
  function update(n){
    const p=data.tracks.spin[n];world.scale.set(p.scale);actor.rotation=p.angle;ornaments.rotation=-p.angle+data.spin.ornamentPhase;
    for(const {d,sprite} of columns){
      sprite.visible=n>=d.start&&n<d.end;const q=d.screenTrack?.[n-d.start];
      if(q){sprite.scale.set(q.scale);sprite.position.set(d.x*q.scale+q.x,d.y*q.scale+q.y);}
      else if(d.world){sprite.scale.set(p.scale);sprite.position.set(960+(d.x-960)*p.scale,540+(d.y+(d.track?.[n-d.start]?.y??0)-540)*p.scale);}
      else{sprite.scale.set(1);sprite.position.set(d.x,d.y+(d.track?.[n-d.start]?.y??0));}
    }
  }
  return {root,update};
}
