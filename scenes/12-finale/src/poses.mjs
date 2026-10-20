export function pose(group,p){
  if(!p)return;
  group.position.set(p.x??0,p.y??0);group.scale.set(p.scaleX??p.scale??1,p.scaleY??p.scale??1);group.rotation=p.angle??0;
}
