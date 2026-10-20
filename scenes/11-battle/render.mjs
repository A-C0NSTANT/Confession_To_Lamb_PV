import {repositoryRoot,workspacePath,loadPlaywright,resolveFFmpeg,resolveBrowser,resolveGpu,outputPath} from '../../scripts/runtime.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';

const root=path.dirname(fileURLToPath(import.meta.url));
const scene=JSON.parse(fs.readFileSync(path.join(root,'assets/scene.json'),'utf8'));
const frameCount=scene.frames,fps=scene.fps;
const options=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const work=workspacePath('archive/work/gameover');
const temporary=workspacePath('archive/work/tmp');
fs.mkdirSync(temporary,{recursive:true});
process.env.TEMP=temporary;process.env.TMP=temporary;process.env.TMPDIR=temporary;
function encoderPath(){return resolveFFmpeg(options); }
const playwright=loadPlaywright();
const server=http.createServer((req,res)=>{
  let target=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(target===root)target=path.join(root,'src/index.html');
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(error,data)=>{
    if(error){res.writeHead(404).end();return;}
    const ext=path.extname(target);res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png'})[ext]||'application/octet-stream');
    res.end(data);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  const executable=resolveBrowser(playwright,options);
  browser=await playwright.chromium.launch({headless:true,executablePath:executable,args:[`--use-angle=${resolveGpu(options,'swiftshader')}`,'--enable-unsafe-swiftshader','--disable-gpu-vsync']});
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  page.on('pageerror',error=>console.error(error));
  page.on('console',message=>{if(['error','warning'].includes(message.type()))console.error(message.text());});
  const query=new URLSearchParams({expressions:options.expressions||'on',layers:options.layers||'on'});
  await page.goto(`http://127.0.0.1:${server.address().port}/?${query}`);
  await page.waitForFunction(()=>window.ready===true,undefined,{timeout:60000});
  const stage=Number(options.stage||4);
  if(options.frames){
    const dir=path.resolve(options.out||path.join(work,'render-frames'));
    fs.mkdirSync(dir,{recursive:true});
    const requested=options.frames==='all'?Array.from({length:frameCount},(_,n)=>n):options.frames.split(',').map(Number);
    for(const n of requested){
      const encoded=await page.evaluate(async({n,stage})=>window.renderFrame(n,stage),{n,stage});
      fs.writeFileSync(path.join(dir,`frame-${String(n).padStart(4,'0')}.png`),Buffer.from(encoded,'base64'));
    }
    console.log(`Rendered ${requested.length} frame(s) at stage ${stage}`);
  } else {
    const ffmpeg=encoderPath();
    const out=path.resolve(options.out||outputPath(root,'gameover_lamb_rebuilt_1080p.mp4'));
    const enc=spawn(ffmpeg,['-v','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0','-i',path.join(root,'assets/audio.m4a'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','slow','-crf','14','-pix_fmt','yuv420p','-vf','scale=out_color_matrix=bt709:out_range=tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','copy','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
    const complete=new Promise((resolve,reject)=>{enc.once('error',reject);enc.once('close',code=>code===0?resolve():reject(new Error(`FFmpeg exited ${code}`)));});
    for(let n=0;n<frameCount;n++){
      const encoded=await page.evaluate(async({n,stage})=>window.renderFrame(n,stage),{n,stage});
      if(!enc.stdin.write(Buffer.from(encoded,'base64')))await new Promise(resolve=>enc.stdin.once('drain',resolve));
      if(n%48===0)console.log(`Frame ${n}/${frameCount}`);
    }
    enc.stdin.end();await complete;console.log(out);
  }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
