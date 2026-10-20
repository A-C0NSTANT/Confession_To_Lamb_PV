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
uniform vec2 uRed;
uniform vec2 uGreen;
uniform vec2 uBlue;
uniform float uBlocks;
uniform float uPhase;
uniform float uGrain;
uniform float uSeed;
out vec4 finalColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*31.7)*43758.5453);}
vec2 uv(vec2 p){return clamp(p*uInputSize.zw,vec2(0.0),vec2(1.0));}
void main(){
  vec2 p=vTextureCoord*uInputSize.xy;
  if(uBlocks>0.0){
    float band=floor(p.y/58.0),noise=hash(vec2(band,uPhase));
    float active=step(.68,noise);
    p.x+=(hash(vec2(band+47.0,uPhase))-.5)*66.0*uBlocks*active;
    if(noise>.94)p.y=floor(p.y/4.0)*4.0;
  }
  vec3 color=vec3(texture(uTexture,uv(p-uRed)).r,texture(uTexture,uv(p-uGreen)).g,texture(uTexture,uv(p-uBlue)).b);
  color+=vec3((hash(floor(p)+uPhase*43.0)-.5)*uGrain*uBlocks);
  finalColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
export function createEffects(parameters){
  const uniforms=new UniformGroup({uRed:{value:new Float32Array(2),type:'vec2<f32>'},uGreen:{value:new Float32Array(2),type:'vec2<f32>'},uBlue:{value:new Float32Array(2),type:'vec2<f32>'},uBlocks:{value:0,type:'f32'},uPhase:{value:0,type:'f32'},uGrain:{value:parameters.grainAmount,type:'f32'},uSeed:{value:parameters.seed,type:'f32'}});
  const filter=new Filter({glProgram:GlProgram.from({vertex,fragment,name:'gameover-screen-glitch'}),resources:{glitchUniforms:uniforms},padding:0});
  return {filter,update(n,p){
    const u=uniforms.uniforms;
    for(const [key,input] of [['uRed','r'],['uGreen','g'],['uBlue','b']]){u[key][0]=p[input][0]*parameters.rgbScale;u[key][1]=p[input][1]*parameters.rgbScale;}
    u.uBlocks=p.blocks*parameters.blockStrength;u.uPhase=Math.floor(n/2);
  }};
}
