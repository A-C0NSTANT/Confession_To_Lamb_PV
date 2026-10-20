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
const toneFragment=`precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uGain;
uniform float uLift;
out vec4 finalColor;
void main(){vec4 c=texture(uTexture,vTextureCoord);finalColor=vec4(clamp(c.rgb*uGain+vec3(uLift*c.a),0.0,c.a),c.a);}`;
const glitchFragment=`precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec2 uRed;
uniform vec2 uGreen;
uniform vec2 uBlue;
uniform float uTear;
uniform float uPhase;
uniform float uSeed;
uniform float uTaps;
uniform float uTrailStrength;
out vec4 finalColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed*31.7)*43758.5453);}
vec3 image(vec2 p){
  vec2 r=clamp((p-uRed)*uInputSize.zw,vec2(0.0),uInputSize.zw*uInputSize.xy);
  vec2 g=clamp((p-uGreen)*uInputSize.zw,vec2(0.0),uInputSize.zw*uInputSize.xy);
  vec2 b=clamp((p-uBlue)*uInputSize.zw,vec2(0.0),uInputSize.zw*uInputSize.xy);
  return vec3(texture(uTexture,r).r,texture(uTexture,g).g,texture(uTexture,b).b);
}
void main(){
  vec2 p=vTextureCoord*uInputSize.xy;vec3 color=image(p);
  if(uTear>0.0){
    float col=floor(p.x/2.0),h=hash(vec2(col,uPhase));
    float length=170.0*uTear*uTear;
    float displacement=(h-.24)*length;
    vec2 source=p-vec2((hash(vec2(col+51.0,uPhase))-.5)*uTear*4.0,displacement);
    color=image(source);
    for(int i=1;i<=8;i++){
      if(float(i)>uTaps)break;
      float f=float(i)/uTaps;
      vec3 trail=image(source-vec2(0.0,f*length));
      color=max(color,trail*uTrailStrength*(1.0-f*.72)*min(1.0,uTear*1.8));
    }
    float stripes=hash(vec2(col,floor(p.y/3.0)+uPhase*73.0));
    color+=vec3((stripes-.5)*.05*uTear);
    color*=1.0-step(.985,hash(vec2(col+271.0,uPhase)))*min(.75,uTear*.5);
  }
  finalColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
export function createEffects(parameters){
  const toneUniforms=new UniformGroup({uGain:{value:parameters.actorGain,type:'f32'},uLift:{value:parameters.actorLift,type:'f32'}});
  const tone=new Filter({glProgram:GlProgram.from({vertex,fragment:toneFragment,name:'finale-actor-tone'}),resources:{toneUniforms},padding:0});
  const uniforms=new UniformGroup({uRed:{value:new Float32Array(2),type:'vec2<f32>'},uGreen:{value:new Float32Array(2),type:'vec2<f32>'},uBlue:{value:new Float32Array(2),type:'vec2<f32>'},uTear:{value:0,type:'f32'},uPhase:{value:0,type:'f32'},uSeed:{value:parameters.seed,type:'f32'},uTaps:{value:parameters.trailTaps,type:'f32'},uTrailStrength:{value:parameters.trailStrength,type:'f32'}});
  const glitch=new Filter({glProgram:GlProgram.from({vertex,fragment:glitchFragment,name:'finale-rgb-tearing'}),resources:{glitchUniforms:uniforms},padding:0});
  return {tone,glitch,update(n,frame){
    const u=uniforms.uniforms;u.uRed[0]=frame.r[0]*parameters.rgbScale;u.uRed[1]=frame.r[1]*parameters.rgbScale;u.uGreen[0]=frame.g[0]*parameters.rgbScale;u.uGreen[1]=frame.g[1]*parameters.rgbScale;u.uBlue[0]=frame.b[0]*parameters.rgbScale;u.uBlue[1]=frame.b[1]*parameters.rgbScale;
    u.uTear=frame.tear*parameters.tearScale;u.uPhase=Math.floor(n/parameters.holdFrames);
  }};
}
