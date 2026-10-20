import {Container,Sprite} from '../vendor/pixi.mjs';

export async function createLoading(data,load){
  const root=new Container(),entries=[];
  for(const [name,d] of Object.entries(data.loading)){
    if(name==='dots')continue;
    const sprite=new Sprite(await load(d.file));sprite.position.set(d.x,d.y);root.addChild(sprite);entries.push({sprite,start:name==='loading'?418:444,end:name==='loading'?444:451});
  }
  for(const d of data.loading.dots){const sprite=new Sprite(await load(d.file));sprite.position.set(d.x,d.y);root.addChild(sprite);entries.push({sprite,start:d.start,end:451});}
  return {root,update(n){for(const e of entries)e.sprite.visible=n>=e.start&&n<e.end;}};
}
