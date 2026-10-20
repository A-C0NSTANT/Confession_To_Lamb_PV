import {Container,Sprite} from '../vendor/pixi.mjs';

export async function createCharacterRig(rig,portrait,parameters,load){
  const root=new Container(),animated={},reference={};
  async function sprite(file){return new Sprite(await load('layers/'+file));}
  async function layered(family){
    const name=family==='laugh'?'笑姿':'浮空';
    const point=part=>{const p=parameters[part][name]['关节支点_素材坐标'];return [p['横'],p['纵']];};
    const d={...rig[family],bodyPivot:point('body'),headPivot:point('head'),leftArmPivot:point('leftArm'),rightArmPivot:point('rightArm')},group=new Container(),body=new Container(),head=new Container(),headCalibration=new Container(),leftArm=new Container(),rightArm=new Container();
    body.pivot.set(...d.bodyPivot);body.position.set(...d.bodyPivot);group.addChild(body);
    head.pivot.set(...d.headPivot);head.position.set(...d.headPivot);
    if(family==='float'){headCalibration.pivot.set(...portrait.float.headPivot);headCalibration.position.set(...portrait.float.headPivot);headCalibration.scale.set(portrait.float.headScale);}
    head.addChild(headCalibration);
    leftArm.pivot.set(...d.leftArmPivot);leftArm.position.set(...d.leftArmPivot);
    rightArm.pivot.set(...d.rightArmPivot);rightArm.position.set(...d.rightArmPivot);
    leftArm.addChild(await sprite(d.files.leftArm));rightArm.addChild(await sprite(d.files.rightArm));
    const heads={};
    if(family==='float'){
      for(const kind of ['open','closed','threat']){const s=await sprite(`float-head-${kind}.png`);headCalibration.addChild(s);heads[kind]=s;}
    }else{headCalibration.addChild(await sprite(d.files.woolPatch),await sprite(d.files.head));}
    body.addChild(await sprite(d.files.neckPatch),await sprite(d.files.shoulderPatch));
    if(family==='laugh')body.addChild(rightArm);
    body.addChild(head,await sprite(d.files.torso),leftArm);
    if(family==='float')body.addChild(rightArm);
    body.addChild(await sprite(d.files.cover));root.addChild(group);
    return {group,body,head,leftArm,rightArm,heads,definition:d};
  }
  animated.laugh=await layered('laugh');animated.float=await layered('float');
  reference.laugh=new Sprite(await load('lamb-laugh-open.png'));
  reference.float=new Container();const staticHead=new Container(),hp=portrait.float.headPivot;
  staticHead.pivot.set(...hp);staticHead.position.set(...hp);staticHead.scale.set(portrait.float.headScale);reference.heads={};
  for(const kind of ['open','closed','threat']){const s=new Sprite(await load(`float-head-${kind}.png`));staticHead.addChild(s);reference.heads[kind]=s;}
  reference.float.addChild(staticHead,new Sprite(await load('float-body.png')));root.addChild(reference.laugh,reference.float);
  const zero={y:0,angle:0};
  function update(kind,state,mode){
    const family=kind==='laugh'?'laugh':'float',useReference=mode==='off';
    for(const key of ['laugh','float']){animated[key].group.visible=!useReference&&key===family;reference[key].visible=useReference&&key===family;}
    if(family==='float')for(const key of ['open','closed','threat']){animated.float.heads[key].visible=reference.heads[key].visible=key===kind;}
    if(useReference)return;
    const q=animated[family],d=q.definition;
    for(const part of ['body','head','leftArm','rightArm']){
      const p=mode==='neutral'?zero:state[part],pivot=d[part==='body'?'bodyPivot':part==='head'?'headPivot':part==='leftArm'?'leftArmPivot':'rightArmPivot'];
      q[part].position.set(pivot[0],pivot[1]+p.y);q[part].rotation=p.angle;
    }
  }
  return {root,animated,reference,update};
}
