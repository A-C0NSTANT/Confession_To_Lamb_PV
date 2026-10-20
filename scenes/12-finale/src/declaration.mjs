import {Container,Sprite,Filter,GlProgram,UniformGroup,Rectangle} from '../vendor/pixi.mjs';
import {pose} from './poses.mjs';

export async function createDeclaration(data,load){
  const root=new Container(),photo=new Container(),background=new Sprite(await load('cathedral.png'));background.width=1920;background.height=1080;
  const registration=new Container();registration.addChild(background);pose(registration,data.materials.photoRegistration);photo.addChild(registration);root.addChild(photo);
  const actor=new Container();
  const portrait=new Sprite(await load('lamb-ritual-triangle.png'));
  pose(portrait,data.materials.ritual);actor.addChild(portrait);
  root.addChild(actor);
  // Tinting is a material treatment and never affects the extracted lettering.
  const uniforms=new UniformGroup({uGain:{value:data.effects.actorGain,type:'f32'}});
  const vertex=`precision highp float;in vec2 aPosition;out vec2 vTextureCoord;uniform vec4 uInputSize;uniform vec4 uOutputFrame;uniform vec4 uOutputTexture;void main(){vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;p.x=p.x*(2.0/uOutputTexture.x)-1.0;p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;gl_Position=vec4(p,0.0,1.0);vTextureCoord=aPosition*(uOutputFrame.zw*uInputSize.zw);}`;
  const fragment=`precision highp float;in vec2 vTextureCoord;uniform sampler2D uTexture;uniform float uGain;out vec4 finalColor;void main(){vec4 c=texture(uTexture,vTextureCoord);finalColor=vec4(c.rgb*uGain,c.a);}`;
  actor.filters=[new Filter({glProgram:GlProgram.from({vertex,fragment,name:'finale-ritual-tone'}),resources:{toneUniforms:uniforms},padding:0})];actor.filterArea=new Rectangle(0,0,1920,1080);
  const words=[];
  for(const d of data.text.entries){
    const group=new Container();root.addChild(group);
    for(const file of [d.under,d.file].filter(Boolean)){const sprite=new Sprite(await load(file));sprite.position.set(d.x,d.y);group.addChild(sprite);}
    words.push({d,group});
  }
  return {root,update(n){
    photo.visible=n>=35;if(photo.visible)pose(photo,data.tracks.photo[n]);pose(actor,data.tracks.declaration[n]);
    for(const {d,group} of words){group.visible=n>=d.start&&n<d.end;pose(group,d.track?.[n-d.start]??{scale:1,x:0,y:0});}
  }};
}
