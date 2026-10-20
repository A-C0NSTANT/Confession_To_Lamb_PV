import {Filter,GlProgram,UniformGroup} from '../vendor/pixi.mjs';

const vertex=`precision highp float;
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
void main(){
  vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;
  p.x=p.x*(2.0/uOutputTexture.x)-1.0;
  p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;
  gl_Position=vec4(p,0.0,1.0);
  vTextureCoord=aPosition*(uOutputFrame.zw*uInputSize.zw);
}`;
const fragment=`precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float uGain;
uniform float uLift;
uniform float uCurve;
uniform float uAmount;
uniform float uGrain;
uniform float uSeed;
out vec4 finalColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*74.7)*43758.5453);}
float valueNoise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main(){
  vec4 c=texture(uTexture,vTextureCoord);vec2 pixel=vTextureCoord*uInputSize.xy;
  float noise=.65*valueNoise(pixel/uGrain)+.25*hash(floor(pixel))+.10*valueNoise(pixel/(uGrain*4.0));
  vec3 rgb=c.rgb*uGain+c.rgb*c.rgb*uCurve+vec3(uLift+(noise-.5)*uAmount);
  finalColor=vec4(clamp(rgb,0.0,1.0),c.a);
}`;
export function createTreatment(data,snow){
  const uniforms=new UniformGroup({uGain:{value:.43,type:'f32'},uLift:{value:.07,type:'f32'},uCurve:{value:.12,type:'f32'},uAmount:{value:.12,type:'f32'},uGrain:{value:4,type:'f32'},uSeed:{value:19,type:'f32'}});
  const filter=new Filter({glProgram:GlProgram.from({vertex,fragment,name:'narinder-snow'}),resources:{treatmentUniforms:uniforms},padding:0});
  return {filter,update(n,stage){
    const p=data.effects.frames[n],q=snow,u=uniforms.uniforms,rest=1-p.white;
    u.uGain=p.gain-.05*rest;u.uLift=p.lift;u.uCurve=.12*rest;u.uAmount=stage>=4?q.amount:0;u.uGrain=q.grainSize;
    u.uSeed=q.seed+Math.floor((n-data.cuts.main)/q.holdFrames)*1.61803398875;
  }};
}
