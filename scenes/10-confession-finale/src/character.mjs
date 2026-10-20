import {Container,Sprite,Graphics} from '../vendor/pixi.mjs';

export async function createCharacter(rig,load){
  const mouthScale=rig.face.mouthScale??1;
  if(!Number.isFinite(mouthScale)||mouthScale<=0)throw new Error('face.mouthScale must be a positive number');
  const root=new Container(),head=new Container(),[bx,by]=rig.bodyPivot,[hx,hy]=rig.headPivot;
  root.pivot.set(bx,by);root.scale.set(rig.placement.scale);
  root.addChild(new Graphics().poly([320,830,690,830,760,1040,260,1040]).fill(0xbb2030).stroke({width:8,color:0x08070a}));
  root.addChild(new Sprite(await load(rig.files.body)));
  head.pivot.set(hx,hy);head.position.set(hx,hy);head.addChild(new Sprite(await load(rig.files.head)));root.addChild(head);
  // Keep a shared mouth center even for sprites with full-character canvases.
  const mouthLayer=new Container();mouthLayer.pivot.set(515,785);mouthLayer.position.set(515,785);mouthLayer.scale.set(mouthScale);
  const eyes={},mouths={};
  async function facialParts(descriptions,target,parent=head){
    for(const [key,d] of Object.entries(descriptions)){
      const texture=await load(d.file),sprite=new Sprite(texture),[x,y,w,h]=d.bounds;
      const [px,py]=d.pivot??[texture.width/2,texture.height/2];
      sprite.pivot.set(px,py);sprite.position.set(x+px/d.resolution,y+py/d.resolution);
      sprite.scale.set(1/d.resolution,(d.scaleY??1)/d.resolution);sprite.rotation=d.rotation??0;
      parent.addChild(sprite);target[key]=sprite;
    }
  }
  await facialParts(rig.face.eyes,eyes);await facialParts(rig.face.mouths,mouths,mouthLayer);head.addChild(mouthLayer);
  root.addChild(new Sprite(await load(rig.files.hands)));
  function update(p,state,animated=true){
    const s=rig.placement.scale;root.position.set(rig.placement.x+bx*s+(animated?p.body.x:0),rig.placement.y+by*s+(animated?p.body.y:0));root.rotation=animated?p.body.angle:0;
    head.position.set(hx+(animated?p.head.x:0),hy+(animated?p.head.y:0));head.rotation=animated?p.head.angle:0;
    for(const [key,sprite] of Object.entries(eyes))sprite.visible=key===state.eyes;
    for(const [key,sprite] of Object.entries(mouths))sprite.visible=key===state.mouth;
  }
  return {root,head,eyes,mouths,update};
}
