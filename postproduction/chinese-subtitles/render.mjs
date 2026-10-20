import {repositoryRoot,workspacePath,loadPlaywright,resolveFFmpeg,resolveBrowser,resolveGpu,outputPath} from '../../scripts/runtime.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const workspace=repositoryRoot;
const options=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/events.json'),'utf8'));
const work=path.join(workspace,'archive/work/subtitle-study');
const temporary=path.join(workspace,'archive/work/tmp');fs.mkdirSync(temporary,{recursive:true});
process.env.TEMP=temporary;process.env.TMP=temporary;process.env.TMPDIR=temporary;
const playwright=loadPlaywright();
const server=http.createServer((req,res)=>{
 let target=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(target===root)target=path.join(root,'src/index.html');
 if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(target,(error,body)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png'})[path.extname(target)]||'application/octet-stream');res.end(body);});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await playwright.chromium.launch({headless:true,executablePath:resolveBrowser(playwright,options),args:['--disable-gpu-vsync']});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 page.on('pageerror',e=>console.error(e));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.waitForFunction(()=>window.ready===true,undefined,{timeout:60000});
 if(options.frames){
  const dir=path.resolve(options.out||path.join(work,'preview-transparent'));fs.mkdirSync(dir,{recursive:true});
  const frames=options.frames==='all'?Array.from({length:data.frames},(_,n)=>n):options.frames.split(',').map(Number);
  for(const n of frames){const encoded=await page.evaluate(n=>window.renderFrame(n),n);fs.writeFileSync(path.join(dir,`frame-${String(n).padStart(4,'0')}.png`),Buffer.from(encoded,'base64'));}
  console.log(`Rendered ${frames.length} transparent preview frames to ${dir}`);
 }else{
  const ffmpeg=resolveFFmpeg(options);
  const output=path.resolve(options.out||outputPath(root,'成品-中文字幕.mp4'));
  const filters='[0:v:0]scale=in_color_matrix=bt709:in_range=tv,format=rgba[base];[base][1:v:0]overlay=0:0:eof_action=pass:repeatlast=0:format=rgb:alpha=straight,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]';
  const enc=spawn(ffmpeg,['-hide_banner','-loglevel','warning','-y','-i',path.resolve(options.input||path.join(workspace,'archive/inputs/edit/成品-无字幕.mp4')),'-f','image2pipe','-framerate',String(data.fps),'-vcodec','png','-i','pipe:0','-filter_complex',filters,'-map','[v]','-map','0:a:0','-frames:v',String(data.frames),'-c:v','libx264','-preset',options.preset||'slow','-crf','14','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','copy','-movflags','+faststart',output],{stdio:['pipe','inherit','inherit']});
  let encoderError;
  const complete=new Promise((resolve,reject)=>{enc.once('error',reject);enc.once('close',code=>code===0?resolve():reject(new Error('FFmpeg exited '+code)));});
  complete.catch(error=>{encoderError=error;});enc.stdin.on('error',error=>{encoderError=error;});
  const first=Number(options.start||0),last=options.end?Number(options.end):data.frames;
  if(first!==0||last!==data.frames)throw new Error('Use --frames for subset previews; the final composite always covers the complete base video.');
  for(let n=0;n<data.frames;n++){
   if(encoderError)throw encoderError;
   const encoded=await page.evaluate(n=>window.renderFrame(n),n);
   if(!enc.stdin.write(Buffer.from(encoded,'base64')))await new Promise((resolve,reject)=>{
    const onDrain=()=>{enc.stdin.off('error',onError);resolve();};
    const onError=error=>{enc.stdin.off('drain',onDrain);reject(error);};
    enc.stdin.once('drain',onDrain);enc.stdin.once('error',onError);
   });
   if(n%120===0)console.log(`Chinese subtitles frame ${n}/${data.frames}`);
  }
  enc.stdin.end();await complete;console.log('Complete: '+output);
 }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
