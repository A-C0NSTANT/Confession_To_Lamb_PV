import {Container,Sprite,Texture,Rectangle,Graphics} from '../vendor/pixi.mjs';

export async function createTriptych(data,load){
  const root=new Container(),cards=[],atlas=await load('text.png');
  function text(d){return new Sprite(new Texture({source:atlas.source,frame:new Rectangle(...d.rect)}));}
  for(const d of data.panels){
    const group=new Container(),art=new Sprite(await load(d.file)),[l,t,r,b]=d.box;
    art.scale.set((r-l)/art.texture.width);art.position.set(l,t);
    const mask=new Graphics().rect(l,t,r-l,b-t).fill(0xffffff);
    const word=data.labels.find(w=>w.name===d.name),label=text(word);label.position.set(word.x,word.y);
    group.addChild(art,label,mask);group.mask=mask;root.addChild(group);cards.push({d,group});
  }
  const grid=new Sprite(await load('grid.png',true));root.addChild(grid);
  const figures={};
  for(const name of ['open','cheek']){
    const d=data.characters[name],sprite=new Sprite(await load(d.file));sprite.scale.set(d.scale);root.addChild(sprite);figures[name]=sprite;
  }
  const b=data.effects.border;
  const fill=new Graphics().rect(b.x,b.y,b.width,b.height).fill(0x000000);
  const border=new Graphics().rect(b.x,b.y,b.width,b.height).stroke({width:b.thickness,color:0xffffff});
  root.addChild(fill,border);
  const captions=data.captions.map(d=>{const sprite=text(d);sprite.scale.set(d.scale??1);root.addChild(sprite);return {d,sprite};});
  function update(n,stage){
    const camera=data.camera[n];root.scale.set(camera.scale);root.position.set(camera.x,camera.y);
    for(const {d,group} of cards){const p=data.tracks[d.name][n];group.visible=!!p;group.position.set(p?.x??0,p?.y??0);group.alpha=p?.alpha??1;}
    const fx=data.effects.frames[n];grid.visible=stage>=2;grid.alpha=fx.grid;
    for(const [name,sprite] of Object.entries(figures)){
      const d=data.characters[name],p=data.tracks[name][n];sprite.visible=stage>=2&&!!p;sprite.position.set(d.x+(p?.x??0),d.y+(p?.y??0));
    }
    fill.visible=border.visible=stage>=2;fill.alpha=fx.fill;border.alpha=fx.border;
    for(const {d,sprite} of captions){const p=n>=d.start&&n<d.end?d.track[n-d.start]:null;sprite.visible=stage>=2&&!!p;sprite.position.set(d.x,d.y+(p?.y??0));sprite.alpha=p?.alpha??0;}
  }
  return {root,update};
}
