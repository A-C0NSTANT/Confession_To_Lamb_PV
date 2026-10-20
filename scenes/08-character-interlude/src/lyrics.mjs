import {Container,Sprite,Texture,Rectangle} from '../vendor/pixi.mjs';

export function createLyrics(data,atlas){
  const root=new Container(),shadows=new Container(),faces=new Container(),glyphs=[];root.addChild(shadows,faces);
  for(const d of data.lyrics){
    const texture=new Texture({source:atlas.source,frame:new Rectangle(...d.rect)}),face=new Sprite(texture),shadow=new Sprite(texture);
    face.tint=d.color;shadow.tint=d.shadowColor;shadow.alpha=d.shadowAlpha;shadows.addChild(shadow);faces.addChild(face);glyphs.push({d,face,shadow});
  }
  return {root,update(n){
    for(const {d,face,shadow} of glyphs){
      const visible=n>=d.start&&n<d.end,p=visible?d.track[n-d.start]:null;face.visible=shadow.visible=visible;
      face.position.set(d.x,d.y+(p?.y??0));shadow.position.set(d.x+d.shadowOffset,d.y+d.shadowOffset+(p?.y??0));
    }
  }};
}
