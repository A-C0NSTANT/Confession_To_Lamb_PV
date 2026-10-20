// Mouths are drawn in the immutable 1024x1536 character coordinate system.
// Eye assets are approved finale sprites and must not be regenerated here.
export function buildFaceAssets(config){
  const result={},resolution=config.resolution;
  const black='#08070a',ivory='#fff7e7',tongue='#c93249';
  function canvas(key,draw){
    const b=config[key].bounds,c=document.createElement('canvas');c.width=b[2]*resolution;c.height=b[3]*resolution;
    const ctx=c.getContext('2d');ctx.scale(resolution,resolution);ctx.translate(-b[0],-b[1]);ctx.lineCap='round';ctx.lineJoin='round';draw(ctx);result[config[key].file]=c.toDataURL('image/png').split(',')[1];
  }
  canvas('mouthClosed',ctx=>{
    ctx.strokeStyle=black;ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(480,768);ctx.quadraticCurveTo(497,792,515,804);ctx.quadraticCurveTo(532,791,547,766);ctx.stroke();
  });
  canvas('mouthOpen',ctx=>{
    ctx.translate(0,750);ctx.scale(1,.65);ctx.translate(0,-750);
    const outer=new Path2D();outer.moveTo(447,762);outer.bezierCurveTo(457,742,477,752,511,756);outer.bezierCurveTo(545,758,570,741,582,756);outer.bezierCurveTo(600,785,584,828,551,839);outer.bezierCurveTo(517,850,475,839,458,819);outer.bezierCurveTo(443,801,438,778,447,762);outer.closePath();
    ctx.fillStyle=black;ctx.fill(outer);ctx.save();ctx.clip(outer);
    ctx.fillStyle=ivory;ctx.beginPath();ctx.moveTo(461,760);ctx.bezierCurveTo(494,770,535,772,567,757);ctx.lineTo(565,766);ctx.bezierCurveTo(532,785,487,782,463,772);ctx.closePath();ctx.fill();
    ctx.fillStyle='#912334';ctx.beginPath();ctx.ellipse(543,824,37,14,-.15,0,Math.PI*2);ctx.fill();ctx.fillStyle=tongue;ctx.beginPath();ctx.ellipse(545,820,30,10,-.15,0,Math.PI*2);ctx.fill();ctx.restore();
  });
  return result;
}
