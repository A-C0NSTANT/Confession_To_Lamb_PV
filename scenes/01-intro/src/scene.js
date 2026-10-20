import { Application, Assets, Container, Graphics, Sprite, Texture, Rectangle } from '../vendor/pixi.mjs';

const data = await fetch('/assets/scene.json').then(r => r.json());
const app = new Application();
await app.init({width:data.width,height:data.height,resolution:1,autoDensity:false,
  background:0x000000,antialias:false,autoStart:false,preference:'webgl',preserveDrawingBuffer:true});
document.body.appendChild(app.canvas);
app.canvas.style.cssText='display:block;width:1920px;height:1080px';
app.stop();
const upper = new Container(), lower = new Container(), art = new Container(), words = new Container();
app.stage.addChild(art,upper,lower,words);
function border(description) {
  const g=new Graphics();
  for (const p of description.parts) p.values.forEach((value,i)=>{
    if (!value) return;
    const x=p.x+(p.axis==='x'?i:0),y=p.y+(p.axis==='y'?i:0);
    g.rect(x,y,p.w||1,p.h||1).fill({color:0xffffff,alpha:value/255});
  });
  return g;
}
upper.addChild(border(data.borders.upper));lower.addChild(border(data.borders.lower));
const sprites={};
for (const [name,desc] of Object.entries(data.illustrations)) {
  const texture=await Assets.load('/assets/'+desc.file);
  texture.source.scaleMode='nearest';
  const s=new Sprite(texture);
  if (name==='lamb') {
    // The bust is composed inside the illustration aperture; lower robe remains off-camera.
    s.x=640;s.y=-60;s.width=640;s.height=960;
  } else {s.x=desc.x;s.y=desc.y;}
  art.addChild(s);sprites[name]=s;
}
const aperture=new Graphics().rect(402,60,1116,533).fill(0xffffff);
app.stage.addChild(aperture);art.mask=aperture;
const pageObjects=[];
if(data.pages.length){
  const atlas=await Assets.load('/assets/glyphs.png');atlas.source.scaleMode='nearest';
  for(const description of data.pages){
    const group=new Container(),glyphs=[];words.addChild(group);
    for(const glyph of description.glyphs){
      const s=new Sprite(new Texture({source:atlas.source,frame:new Rectangle(...glyph.atlas)}));
      s.position.set(glyph.x,glyph.y);group.addChild(s);glyphs.push(s);
    }
    pageObjects.push({description,group,glyphs});
  }
}
const white=new Graphics().rect(0,0,1920,1080).fill(0xffffff);
app.stage.addChild(white);
window.renderFrame=async(n,stage=3)=>{
  if (!Number.isInteger(n)||n<0||n>=data.frames) throw new Error('Invalid frame');
  const state=data.levels[n];
  upper.alpha=state.top;lower.alpha=state.bottom;art.alpha=state.top;
  for (const [name,s] of Object.entries(sprites))s.visible=name===state.scene;
  words.visible=stage>=2;
  for(const {description,group,glyphs} of pageObjects){
    group.visible=n>=description.start&&n<description.end;
    glyphs.forEach((s,i)=>{
      s.visible=true;s.tint=0xffffff;
      if(stage===3){
        let color=[0,0,0];
        for(const [frame,r,g,b] of description.glyphs[i].track||[]){
          if(frame>n)break;color=[r,g,b];
        }
        s.visible=Math.max(...color)>0;s.tint=(color[0]<<16)|(color[1]<<8)|color[2];
      }
    });
  }
  white.alpha=stage===3?state.flash:0;
  app.renderer.render(app.stage);
  return app.canvas.toDataURL('image/png').split(',')[1];
};
window.ready=true;
