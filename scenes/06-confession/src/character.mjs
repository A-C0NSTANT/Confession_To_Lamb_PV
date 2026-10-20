import {Container,Sprite,Graphics} from '../vendor/pixi.mjs';

export async function createCharacter(rig,load){
  const mouthScale=rig.face.mouthScale??1;
  if(!Number.isFinite(mouthScale)||mouthScale<=0)throw new Error('face.mouthScale must be a positive number');
  const root=new Container(),head=new Container(),[bx,by]=rig.bodyPivot,[hx,hy]=rig.headPivot;
  root.pivot.set(bx,by);root.scale.set(rig.placement.scale);
  const neck=new Graphics().poly([320,830,690,830,760,1040,260,1040]).fill(0xbb2030).stroke({width:8,color:0x08070a});root.addChild(neck);
  root.addChild(new Sprite(await load(rig.files.body)));head.pivot.set(hx,hy);head.position.set(hx,hy);head.addChild(new Sprite(await load(rig.files.head)));root.addChild(head);
  // Scale all mouth expressions around the same point in character coordinates.
  const mouthLayer=new Container();mouthLayer.pivot.set(515,785);mouthLayer.position.set(515,785);mouthLayer.scale.set(mouthScale);
  const parts={};
  for(const key of ['eyesClosed','eyesSmile','mouthClosed','mouthOpen']){
    const d=rig.face[key],sprite=new Sprite(await load(d.file));sprite.scale.set(1/(d.resolution??rig.face.resolution));sprite.position.set(d.bounds[0],d.bounds[1]);(key.startsWith('mouth')?mouthLayer:head).addChild(sprite);parts[key]=sprite;
  }
  head.addChild(mouthLayer);
  root.addChild(new Sprite(await load(rig.files.hands)));
  function update(p,state,animated=true){
    const s=rig.placement.scale;root.position.set(rig.placement.x+bx*s+(animated?p.body.x:0),rig.placement.y+by*s+(animated?p.body.y:0));root.rotation=animated?p.body.angle:0;
    head.position.set(hx+(animated?p.head.x:0),hy+(animated?p.head.y:0));head.rotation=animated?p.head.angle:0;
    parts.eyesClosed.visible=state.eyes==='closed';parts.eyesSmile.visible=state.eyes==='smile';parts.mouthClosed.visible=state.mouth==='closed';parts.mouthOpen.visible=state.mouth==='open';
  }
  return {root,head,parts,update};
}
