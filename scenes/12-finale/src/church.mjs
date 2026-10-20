import {Container,Sprite,Texture} from '../vendor/pixi.mjs';
import {pose} from './poses.mjs';

export async function createChurch(data,load){
  const root=new Container(),camera=new Container(),backgroundLayer=new Container(),background=new Sprite(await load('stage-background.png'));
  background.position.set(...data.materials.backgroundOrigin);backgroundLayer.addChild(background);pose(backgroundLayer,data.materials.stageRegistration);camera.addChild(backgroundLayer);root.addChild(camera);
  const silhouette=new Sprite(await load('background-silhouette.png'));pose(silhouette,data.materials.silhouette);camera.addChild(silhouette);
  const necklace=new Sprite(await load('necklace-silhouette.png'));necklace.pivot.set(...data.materials.necklace.anchor);pose(necklace,data.materials.necklace);camera.addChild(necklace);
  const spec=data.spectrum,canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d'),texture=Texture.from(canvas);texture.source.scaleMode='linear';const bars=new Sprite(texture);root.addChild(bars);
  return {root,update(n){
    pose(camera,data.tracks.stage[n]);ctx.clearRect(0,0,1920,1080);ctx.filter=`blur(${spec.blur}px)`;ctx.fillStyle=`rgb(${spec.color},${spec.color},${spec.color})`;
    for(let j=0;j<spec.x.length;j++){const height=spec.heights[n][j];if(height>.1)ctx.fillRect(spec.x[j]-spec.width/2,spec.baseline-height/2,spec.width,height);}
    ctx.filter='none';texture.source.update();
  }};
}
