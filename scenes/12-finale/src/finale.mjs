import {Container,Sprite,MeshPlane} from '../vendor/pixi.mjs';

export async function createFinale(data,load){
  const root=new Container(),first=new Sprite(await load('cg1.png')),second=new Sprite(await load('cg2.png'));
  const third=new MeshPlane({texture:second.texture,verticesX:65,verticesY:49}),buffer=third.geometry.getBuffer('aPosition'),points=buffer.data,rest=new Float32Array(points),cfg=data.sketch;
  for(const s of [first,second,third]){s.scale.set(cfg.scale);root.addChild(s);}
  const [px,py]=cfg.pivot,c=Math.cos(cfg.angle),s=Math.sin(cfg.angle);
  for(let i=0;i<points.length;i+=2){const x=rest[i],y=rest[i+1],u=Math.max(0,Math.min(1,(cfg.weightEnd-y)/(cfg.weightEnd-cfg.weightStart))),weight=u*u*(3-2*u),dx=x-px,dy=y-py;points[i]=x+weight*(c*dx-s*dy-dx);points[i+1]=y+weight*(s*dx+c*dy-dy);}
  buffer.update();
  const f=data.text.fin,fin=new Sprite(await load(f.file));fin.position.set(f.x,f.y);root.addChild(fin);
  return {root,update(n,stage){first.visible=n>=321&&n<326;second.visible=n>=326&&n<328;third.visible=n>=328&&n<330;fin.visible=n>=330;fin.alpha=f.alpha[n];}};
}
