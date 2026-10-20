export function createChannelShift(width,height){
  const input=document.createElement('canvas'),output=document.createElement('canvas');input.width=output.width=width;input.height=output.height=height;
  const source=input.getContext('2d',{willReadFrequently:true}),target=output.getContext('2d');
  return (canvas,offsets)=>{
    source.clearRect(0,0,width,height);source.drawImage(canvas,0,0);const pixels=source.getImageData(0,0,width,height).data,result=target.createImageData(width,height),out=result.data;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4;out[i+3]=255;
      for(let c=0;c<3;c++){const sx=x-offsets[c][0],sy=y-offsets[c][1];out[i+c]=sx>=0&&sx<width&&sy>=0&&sy<height?pixels[(sy*width+sx)*4+c]:0;}
    }
    target.putImageData(result,0,0);return output;
  };
}
