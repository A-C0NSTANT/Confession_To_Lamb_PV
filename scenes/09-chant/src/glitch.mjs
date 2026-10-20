// Recompose authored frames into measured rectangular holds and RGB offsets.
// The cached input is rendered from this project, never sampled from the PV.
export function createGlitch(data,width,height){
  const output=document.createElement('canvas');output.width=width;output.height=height;
  const ctx=output.getContext('2d',{willReadFrequently:true});let held=null;
  function pixels(canvas){ctx.clearRect(0,0,width,height);ctx.drawImage(canvas,0,0);return ctx.getImageData(0,0,width,height);}
  function capture(canvas){held=pixels(canvas).data.slice();}
  function apply(canvas,n,scale){
    const input=pixels(canvas),current=input.data,out=new Uint8ClampedArray(current),cx=width/2,cy=height/2;
    for(const tile of data.tiles){
      const [l,t,r,b]=tile.box,[dx,dy]=tile.shift,step=tile.pixel??1,source=tile.current?current:held;
      const L=Math.max(0,Math.floor(cx+(l-cx)*scale)),R=Math.min(width,Math.ceil(cx+(r-cx)*scale));
      const T=Math.max(0,Math.floor(cy+(t-cy)*scale)),B=Math.min(height,Math.ceil(cy+(b-cy)*scale));
      for(let y=T;y<B;y++)for(let x=L;x<R;x++){
        const bx=cx+(x-cx)/scale,by=cy+(y-cy)/scale,index=(y*width+x)*4;
        for(let c=0;c<3;c++){
          let sx=Math.round((bx-dx)/step)*step,sy=Math.round((by-dy+(1-c)*tile.split)/step)*step;
          if(tile.current){sx=Math.round(cx+(sx-cx)*scale);sy=Math.round(cy+(sy-cy)*scale);}
          let value=sx>=0&&sx<width&&sy>=0&&sy<height?source[(sy*width+sx)*4+c]:48;
          if(tile.noise){const v=Math.sin(Math.floor(bx/step)*12.9898+Math.floor(by/step)*78.233+c*29.3)*43758.5453;value=value*(1-tile.noise)+(v-Math.floor(v))*255*tile.noise;}
          out[index+c]=value;
        }
        out[index+3]=255;
      }
    }
    input.data.set(out);ctx.putImageData(input,0,0);return output;
  }
  return {capture,apply,get ready(){return held!==null;}};
}
