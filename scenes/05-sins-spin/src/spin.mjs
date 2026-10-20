import {Container,Sprite,Graphics} from '../vendor/pixi.mjs';

export async function createSpin(data,load){
  const root=new Container(),gray=data.spin.background;
  root.addChild(new Graphics().rect(0,0,1920,1080).fill(gray*0x010101));
  const world=new Container();world.pivot.set(960,540);world.position.set(960,540);root.addChild(world);
  // Keep the original scene center when a restored layer adds transparent padding.
  for(const file of ['emblem.png','braid.png','rings.png']){const sprite=new Sprite(await load(file));sprite.anchor.set(.5);sprite.position.set(960,540);world.addChild(sprite);}
  const ornaments=new Sprite(await load('ornaments.png'));ornaments.anchor.set(.5);ornaments.position.set(960,540);world.addChild(ornaments);
  const d=data.characters.floating,actor=new Sprite(await load(d.file));actor.pivot.set(...d.anchor);actor.position.set(960,540);actor.scale.set(d.scale);world.addChild(actor);
  const columns=[];
  for(const d of data.spin.columns){const sprite=new Sprite(await load(d.file));(d.screenTrack?root:world).addChild(sprite);columns.push({d,sprite});}
  const reference=data.tracks.spin[data.spin.ornamentReference].angle;
  function update(n,stage){
    const p=data.tracks.spin[n];world.scale.set(p.scale);actor.rotation=p.angle;ornaments.rotation=-(p.angle-reference);actor.visible=stage>=3;
    for(const {d,sprite} of columns){
      sprite.visible=n>=d.start&&n<d.end;
      const p=d.screenTrack?.[n-d.start];
      if(p){sprite.scale.set(p.scale);sprite.position.set(d.x*p.scale+p.x,d.y*p.scale+p.y);}
      else sprite.position.set(d.x,d.y+(d.track?.[n-d.start]?.y??0));
    }
  }
  return {root,update};
}
