import {Container,Sprite,Texture,Rectangle,Graphics} from '../vendor/pixi.mjs';
import {createTextAtlas,updateCaptions} from './text.mjs';

export async function createTriptych(data,load){
  const root=new Container(),cards=[],atlas=await load('captions.png');
  for(const d of data.panels){
    const group=new Container(),art=new Sprite(await load(d.file)),[l,t,r,b]=d.box;
    art.scale.set((r-l)/art.texture.width);art.position.set(l,t);
    const mask=new Graphics().rect(l,t,r-l,b-t).fill(0xffffff);
    const word=data.captions.find(w=>w.name===d.name),label=new Sprite(new Texture({source:atlas.source,frame:new Rectangle(...word.face)}));label.position.set(word.x,word.y);
    group.addChild(art,label);
    let alternate=null;
    if(data.prideFlash?.panel===d.name){
      const flash=data.prideFlash,portrait=new Sprite(await load(flash.file)),caption=new Sprite(await load(flash.labelFile));
      portrait.scale.set((r-l)/portrait.texture.width);portrait.position.set(l,t);caption.position.set(flash.labelX,flash.labelY);
      group.addChild(portrait,caption);alternate={portrait,caption};
    }
    group.addChild(mask);group.mask=mask;root.addChild(group);cards.push({d,group,art,label,alternate});
  }
  const grid=new Sprite(await load('cards-grid.png',true));root.addChild(grid);
  const figures={};
  for(const name of ['open','cheek']){
    const d=data.characters[name],sprite=new Sprite(await load(d.file));sprite.scale.set(d.scale);root.addChild(sprite);figures[name]=sprite;
  }
  const b=data.effects.cardsBorder,fill=new Graphics().rect(b.x,b.y,b.width,b.height).fill(0x000000),border=new Graphics().rect(b.x,b.y,b.width,b.height).stroke({width:b.thickness,color:0xffffff});root.addChild(fill,border);
  const captions=await createTextAtlas('captions.png',data.captions.filter(d=>d.scene==='cards'),load,root);
  function update(n,stage){
    const camera=data.tracks.camera[n];root.scale.set(camera.scale);root.position.set(camera.x,camera.y);
    for(const {d,group,art,label,alternate} of cards){
      const p=data.tracks[d.name][n];group.visible=!!p;group.position.set(p?.x??0,p?.y??0);group.alpha=p?.alpha??1;
      const flash=!!alternate&&n===data.prideFlash.frame;art.visible=label.visible=!flash;
      if(alternate)alternate.portrait.visible=alternate.caption.visible=flash;
    }
    const fx=data.effects.frames[n];grid.visible=stage>=3;grid.alpha=fx.grid;
    for(const [name,sprite] of Object.entries(figures)){const d=data.characters[name],p=data.tracks[name][n];sprite.visible=!!p;sprite.position.set(d.x+(p?.x??0),d.y+(p?.y??0));}
    fill.alpha=stage>=3?fx.fill:0;border.alpha=stage>=3?fx.border:(n>=378?1:0);updateCaptions(captions,n);
  }
  return {root,update};
}
