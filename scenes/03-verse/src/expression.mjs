import {Container,Sprite,Texture} from '../vendor/pixi.mjs';

// All coordinates are in the original 1024x1536 character asset. Existing shot
// motion remains on the parent, so the face never needs screen-space tracking.
export function createExpressionRig({original,clean,closedEyes,config,enabled=true}){
  const root=new Container(),rest=new Sprite(original),body=new Sprite(clean),eyes=new Sprite(closedEyes);
  eyes.position.set(config.eyePatch.x,config.eyePatch.y);
  const [x,y,width,height]=config.mouthCanvas,resolution=3;
  const canvas=document.createElement('canvas');canvas.width=width*resolution;canvas.height=height*resolution;
  const ctx=canvas.getContext('2d'),texture=Texture.from(canvas);texture.source.scaleMode='linear';
  const mouth=new Sprite(texture);mouth.position.set(x,y);mouth.scale.set(1/resolution);
  root.addChild(rest,body,eyes,mouth);
  const color=rgb=>`rgb(${rgb.join(',')})`,palette=config.palette;
  function path(points,box){
    const p=new Path2D(),mapped=points.map(([u,v])=>[box[0]+u*box[2],box[1]+v*box[3]]);
    const last=mapped.at(-1),first=mapped[0];p.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
    for(let i=0;i<mapped.length;i++){
      const a=mapped[i],b=mapped[(i+1)%mapped.length];p.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);
    }
    p.closePath();return p;
  }
  let previous='';
  function update(frame){
    const state=enabled?config.frames[frame]:{state:'neutral'};
    const active=state.state!=='neutral';rest.visible=!active;body.visible=mouth.visible=active;eyes.visible=active&&state.state==='grin';
    if(!active){previous='';return;}
    const key=JSON.stringify(state);if(key===previous)return;previous=key;
    const template=config.templates[state.state],outline=path(template.outline,state.box);
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(resolution,0,0,resolution,-x*resolution,-y*resolution);
    ctx.save();ctx.clip(outline);
    ctx.fillStyle=color(palette.cavity);ctx.fill(outline);
    if(template.tongue){ctx.fillStyle=color(palette.tongue);ctx.fill(path(template.tongue,state.box));}
    if(template.teeth){ctx.fillStyle=color(palette.teeth);ctx.fill(path(template.teeth,state.box));}
    // Stroke inward so the measured outer silhouette and its anchor stay fixed.
    ctx.strokeStyle=color(palette.outline);ctx.lineWidth=config.outlineWidth*2;ctx.lineJoin='round';ctx.stroke(outline);
    ctx.restore();texture.source.update();
  }
  update(0);return {root,update};
}
