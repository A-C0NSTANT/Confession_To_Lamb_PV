import {Container,Sprite} from '../vendor/pixi.mjs';
// The pose is one immutable body. Only transparent eye/mouth patches change.
export function createSpeaker({body,faces,placement}){
  const root=new Container();root.addChild(new Sprite(body));const patches={};
  for(const [state,texture] of Object.entries(faces)){
    const sprite=new Sprite(texture);sprite.position.set(placement.x,placement.y);root.addChild(sprite);patches[state]=sprite;
  }
  function update(state){for(const [name,sprite] of Object.entries(patches))sprite.visible=name===state;}
  update('calm');return {root,update};
}
