import {Container,Sprite,Graphics} from '../vendor/pixi.mjs';
import {createTextAtlas,updateCaptions} from './text.mjs';

export async function createChant(data,load){
  const root=new Container(),background=new Sprite(await load('flat-source.png')),main=new Container(),words=new Container();
  const art=new Sprite(await load('chanting.png')),mp=data.placement.main;art.scale.set(mp.scale);art.position.set(mp.x,mp.y);main.addChild(art);
  const vignette=new Sprite(await load('vignette.png')),grid=new Sprite(await load('church-grid.png',true)),dialogue=new Container(),speakerLayer=new Container();
  root.addChild(background,main,vignette,words,grid,dialogue,speakerLayer);
  const b=data.effects.churchBorder,border=new Graphics().rect(b.x,b.y,b.width,b.height).stroke({width:b.thickness,color:0xffffff});dialogue.addChild(border);
  const glyphs=await createTextAtlas('lyrics.png',data.lyrics,load,words);
  const captions=await createTextAtlas('captions.png',data.captions.filter(d=>d.scene==='church'),load,dialogue);
  const actor=new Container(),sp=data.placement.speaker;actor.scale.set(sp.scale);actor.position.set(sp.x,sp.y);speakerLayer.addChild(actor);
  const body=new Sprite(await load('speaker-body.png')),startled=new Sprite(await load('speaker-startled.png'));
  const closed=new Sprite(await load('eyes-closed.png')),smile=new Sprite(await load('eyes-smile.png')),mouth=new Sprite(await load('mouth-smile.png'));
  actor.addChild(body,startled,closed,smile,mouth);
  if(sp.cropBottom){const crop=new Graphics().rect(0,0,1024,sp.cropBottom).fill(0xffffff);actor.addChild(crop);actor.mask=crop;}
  function pose(group,p){if(p){group.position.set(p.x,p.y);group.scale.set(p.scale??1);}}
  function update(n,stage,expressions){
    pose(background,data.tracks.background[n]);pose(main,data.tracks.main[n]);pose(words,data.tracks.background[n]);
    for(const {d,sprites} of glyphs){
      const e=d.exposures.find(e=>n>=e.start&&n<e.end),p=e?.track[n-e.start]??[0,0];
      for(const sprite of sprites){sprite.visible=!!e;sprite.position.set(d.x+p[0],d.y+p[1]);}
    }
    const fx=data.effects.frames[n];vignette.visible=grid.visible=stage>=3;vignette.alpha=fx.vignette;grid.alpha=fx.grid;
    dialogue.visible=n>=175;border.alpha=stage>=3?fx.border:1;updateCaptions(captions,n);
    speakerLayer.visible=!!data.tracks.speaker[n];pose(speakerLayer,data.tracks.speaker[n]);
    const state=stage>=4&&expressions?data.expressions[n]:'startled';
    startled.visible=state==='startled';body.visible=state!=='startled';closed.visible=state==='calm';smile.visible=state==='smile';mouth.visible=state!=='startled';
  }
  return {root,update};
}
