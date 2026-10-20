import {Container,Sprite,Graphics} from '../vendor/pixi.mjs';
import {setPose} from './battle.mjs';

export async function createScreenTear(data,parameters,load){
  const root=new Container(),back=new Container(),front=new Container(),head=new Container(),shards=new Container(),fragments=[],planes=[];
  back.addChild(new Sprite(await load('sword-back.png')));front.addChild(new Sprite(await load('sword-front.png')));
  head.addChild(new Sprite(await load('sword-head.png')));
  // These black planes and clipped photographs are independent screen shards.
  // The intact face/leading sword layer is deliberately above all of them.
  for(const points of [
    [0,0,1920,0,1920,330,1240,440,1000,300,350,65,0,80],
    [0,520,560,660,900,880,1200,1080,0,1080],
    [1400,390,1920,500,1920,1080,1660,1080,1470,880]
  ]){const plane=new Graphics().poly(points).fill(0x000000);shards.addChild(plane);planes.push(plane);}
  const photo=await load('background.png');
  for(const points of [
    [0,0,90,0,160,80,145,245,0,145],
    [340,60,670,255,775,370,650,660,220,270],
    [1100,610,1575,1040,1490,900,1140,560]
  ]){
    const group=new Container(),plate=new Sprite(photo),mask=new Graphics().poly(points).fill(0xffffff);
    setPose(plate,data.backgroundPlacement);group.addChild(plate,mask);group.mask=mask;group.alpha=parameters.introFragmentOpacity;shards.addChild(group);fragments.push(group);
  }
  const topLetters=new Sprite(await load('screen-top-letters.png')),bottomLetters=new Sprite(await load('screen-bottom-letters.png'));
  root.addChild(back,shards,front,topLetters,bottomLetters,head);
  return {root,back,front,update(n){
    const p=data.tracks.intro[n],u=n/8;for(const group of [back,front,head]){group.pivot.set(...p.pivot);setPose(group,p);}
    topLetters.position.set(0,-100*u);bottomLetters.position.set(-20*u,105*u);
    planes[0].y=-100*u;planes[1].y=105*u;planes[2].y=65*u;
    for(let i=0;i<fragments.length;i++){fragments[i].position.set((i-1)*(n-8)*.6,(i%2?1:-1)*(n-8)*.4);fragments[i].scale.y=i===0?1+u*.5:1;}
  }};
}
