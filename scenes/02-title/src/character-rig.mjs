import {Container,Sprite,MeshPlane,Texture,Graphics} from '../vendor/pixi.mjs';

// The fixed mesh vertices preserve the face, wool, costume and crown. A single
// shoulder bone only influences the hand/forearm; its influence tapers at the cuff.
export function createCharacterRig(texture,rig,lidTexture){
  const root=new Container(),rest=new Sprite(texture),body=new Sprite(texture);
  const arm=new MeshPlane({texture,verticesX:rig.arm.verticesX,verticesY:rig.arm.verticesY});
  const buffer=arm.geometry.getBuffer('aPosition');
  const positions=buffer.data,original=new Float32Array(positions);
  root.addChild(rest,body,arm);body.visible=arm.visible=false;
  // Complementary stencil masks keep the untouched image on the original
  // sprite renderer. Only this pinned, local domain uses mesh sampling.
  const polygon=rig.arm.domain.flat();
  const bodyMask=new Graphics().rect(-1,-1,rig.width+2,rig.height+2).fill(0xffffff).poly(polygon).cut();
  const armMask=new Graphics().poly(polygon).fill(0xffffff);
  root.addChild(bodyMask,armMask);body.mask=bodyMask;arm.mask=armMask;
  const canvas=document.createElement('canvas');
  const [x,y,width,height]=rig.eye.bounds;canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d'),eyeTexture=Texture.from(canvas);
  eyeTexture.source.scaleMode='linear';
  const eyelids=new Sprite(eyeTexture);eyelids.position.set(x,y);eyelids.visible=false;root.addChild(eyelids);
  const [px,py]=rig.arm.pivot,eye=rig.eye;
  function point(u,v){return [eye.origin[0]+u*eye.axis[0]+v*eye.normal[0],eye.origin[1]+u*eye.axis[1]+v*eye.normal[1]];}
  function lidBoundary(sample,openness,lower){
    const [u,top,bottom]=sample,center=bottom-(bottom-top)*eye.lowerLidShare;
    return point(u,center+openness*((lower?bottom:top)-center));
  }
  let lastAngle=NaN,lastOpen=NaN;
  function update({armAngle,eyeOpenness}){
    const moving=Math.abs(armAngle)>1e-10;
    rest.visible=!moving;body.visible=arm.visible=moving;
    if(moving&&armAngle!==lastAngle){
      const c=Math.cos(armAngle),s=Math.sin(armAngle);
      for(const [vertex,weight] of rig.arm.weights){
        const i=vertex*2,dx=original[i]-px,dy=original[i+1]-py;
        positions[i]=original[i]+weight*(dx*c-dy*s-dx);
        positions[i+1]=original[i+1]+weight*(dx*s+dy*c-dy);
      }
      buffer.update();
    }
    lastAngle=armAngle;
    eyelids.visible=eyeOpenness<1-1e-8;
    if(eyelids.visible&&eyeOpenness!==lastOpen){
      ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='source-over';
      ctx.drawImage(lidTexture.source.resource,0,0);
      if(eyeOpenness>0){
        ctx.globalCompositeOperation='destination-out';ctx.beginPath();
        const upper=eye.profile.map(p=>lidBoundary(p,eyeOpenness,false));
        const lower=eye.profile.map(p=>lidBoundary(p,eyeOpenness,true)).reverse();
        ctx.moveTo(...upper[0]);for(const p of upper.slice(1))ctx.lineTo(...p);
        for(const p of lower)ctx.lineTo(...p);ctx.closePath();ctx.fill();
      }
      if(eyeOpenness<.12){
        ctx.globalCompositeOperation='source-over';ctx.strokeStyle=`rgba(8,7,10,${1-eyeOpenness/.12})`;
        ctx.lineWidth=1.8;ctx.lineCap='round';ctx.beginPath();
        const line=eye.profile.slice(2,-2).map(p=>lidBoundary(p,0,false));
        ctx.moveTo(...line[0]);for(const p of line.slice(1))ctx.lineTo(...p);ctx.stroke();
      }
      eyeTexture.source.update();
    }
    lastOpen=eyeOpenness;
  }
  return {root,update};
}
