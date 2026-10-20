const radians=value=>value*Math.PI/180;
const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*t*(t*(t*6-15)+10);};

function sampleCurve(keys,phase){
  const t=((phase%1)+1)%1;
  let i=keys.length-1;
  for(let j=0;j<keys.length-1;j++)if(t>=keys[j]['节拍位置']&&t<keys[j+1]['节拍位置']){i=j;break;}
  const count=keys.length,index=k=>(k+count)%count;
  const value=k=>keys[index(k)]['位移强度'];
  const a=keys[i]['节拍位置'],b=i===count-1?1:keys[i+1]['节拍位置'],u=(t-a)/(b-a);
  const p0=value(i-1),p1=value(i),p2=value(i+1),p3=value(i+2);
  const interpolated=.5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u);
  return Math.max(Math.min(p1,p2),Math.min(Math.max(p1,p2),interpolated));
}
function floatPhase(anchors,frame){
  for(let i=1;i<anchors.length;i++)if(frame<anchors[i])return (frame-anchors[i-1])/Math.max(1,anchors[i]-anchors[i-1]);
  return (frame-anchors.at(-2))/Math.max(1,anchors.at(-1)-anchors.at(-2));
}
function familyEnvelope(exposures,index,frame,fade){
  const isLaugh=e=>e.kind==='laugh';let lo=index,hi=index;
  while(lo>0&&isLaugh(exposures[lo-1])===isLaugh(exposures[index]))lo--;
  while(hi+1<exposures.length&&isLaugh(exposures[hi+1])===isLaugh(exposures[index]))hi++;
  if(fade<=0)return 1;
  return Math.min(smooth((frame-exposures[lo].start)/fade),smooth((exposures[hi].end-1-frame)/fade));
}
export function createLayerAnimation(data,animation,portrait,sourcePoses,parameters){
  const root=parameters.root,rootPoses=sourcePoses.map(p=>p?{...p}:null),parts=Array(data.frames).fill(null);
  for(let index=0;index<animation.exposures.length;index++){
    const exposure=animation.exposures[index],family=exposure.kind==='laugh'?'laugh':'float',name=family==='laugh'?'笑姿':'浮空';
    for(let frame=exposure.start;frame<exposure.end;frame++){
      const original=sourcePoses[frame],p=rootPoses[frame],settings=root[name],intro=family==='laugh'&&exposure.start===data.cuts.battle&&settings['完整保留首次入场'];
      const lunge=root['突进'],inLunge=frame>=lunge['开始帧']&&frame<lunge['结束帧'];
      if(root['启用分层动画']&&!intro&&!inLunge)p.y=settings['基准纵坐标']+(original.y-settings['基准纵坐标'])*settings['保留整体上下浮动比例'];
      const calibration=portrait[family],screenScale=p.scale*calibration.scaleMultiplier;
      let weight=familyEnvelope(animation.exposures,index,frame,root['跨姿态渐入渐出_帧']);
      const edge=lunge['过渡帧数'];
      if(frame>=lunge['开始帧']-edge&&frame<lunge['结束帧']+edge){
        const enter=smooth((frame-lunge['开始帧']+edge)/Math.max(1,edge));
        const leave=smooth((lunge['结束帧']+edge-frame)/Math.max(1,edge));
        weight*=1-Math.min(enter,leave)*(1-lunge['分层动作强度']);
      }
      const pose={family,weight,screenScale};
      for(const [part,config] of Object.entries(parameters)){
        if(part==='root')continue;
        const d=config[name],sampleFrame=frame-d['额外相位延迟_帧'];
        let phase;
        if(family==='laugh'){
          // All laugh parts share the current motionFrom retiming, including
          // the repeated invitation exposure at frames 78/95.
          const sourceStart=exposure.motionFrom[0],sourceEnd=exposure.motionFrom[1];
          const u=(sampleFrame-exposure.start)/Math.max(1,exposure.end-exposure.start-1);
          const sourceTime=sourceStart+u*(sourceEnd-sourceStart-1);
          phase=(sourceTime-sourceStart)/Math.max(1,sourceEnd-sourceStart-1);
        }else phase=floatPhase(root['浮空节拍锚点_帧'],sampleFrame);
        const value=sampleCurve(d['节拍曲线'],phase),strength=d['启用']&&root['启用分层动画']?d['动作强度']*weight:0;
        const travel=d[part==='leftArm'||part==='rightArm'?'肩部上下微移行程_像素':'上下行程_像素'];
        const angle=d[part==='head'?'头部倾斜半幅_度':part==='body'?'身体倾斜半幅_度':'肩部摆动半幅_度'];
        pose[part]={y:value*travel*.5*strength/screenScale,angle:radians(Math.max(-1,Math.min(1,value))*angle*d['旋转方向']*strength)};
      }
      parts[frame]=pose;
    }
  }
  return {rootPoses,sourcePoses,parts,parameters,enabled:root['启用分层动画']};
}
