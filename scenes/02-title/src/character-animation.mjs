// Curves are evaluated from absolute sample frames, including out-of-order renders.
const smoother=t=>t*t*t*(t*(t*6-15)+10);
export function sampleCurve(keys,frame){
  if(frame<=keys[0][0])return keys[0][1];
  for(let i=1;i<keys.length;i++){
    const [end,b]=keys[i],[start,a]=keys[i-1];
    if(frame<=end)return a+(b-a)*smoother((frame-start)/(end-start));
  }
  return keys.at(-1)[1];
}
export function characterPose(curves,frame,{arm=true,blink=true}={}){
  return {armAngle:arm?sampleCurve(curves.armDegrees,frame)*Math.PI/180:0,
    eyeOpenness:blink?sampleCurve(curves.eyeOpenness,frame):1};
}
