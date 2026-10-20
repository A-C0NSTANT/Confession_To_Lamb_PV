import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

export const repositoryRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
export function localConfiguration(){
  const file=path.join(repositoryRoot,'archive/local/runtime.json');
  return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
}
export function workspacePath(...parts){return path.join(repositoryRoot,...parts);}
export function loadPlaywright(){
  try{return require('playwright');}catch(error){
    const configured=process.env.PLAYWRIGHT_MODULE||localConfiguration().playwrightModule;
    if(configured)return require(configured);
    throw new Error('Playwright not found. Run npm ci at the repository root.',{cause:error});
  }
}
export function resolveFFmpeg(options={}){
  if(options.ffmpeg||process.env.FFMPEG_PATH)return options.ffmpeg||process.env.FFMPEG_PATH;
  if(spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status===0)return 'ffmpeg';
  const configured=localConfiguration().ffmpeg;
  if(configured&&fs.existsSync(configured))return configured;
  throw new Error('FFmpeg not found. Add it to PATH or set FFMPEG_PATH / --ffmpeg.');
}
export function resolveBrowser(playwright,options={}){
  return options.browser||process.env.BROWSER_PATH||localConfiguration().browser||playwright.chromium.executablePath();
}
export function resolveGpu(options={},preferred='swiftshader'){
  return options.gpu||process.env.PV_RENDER_GPU||(preferred==='d3d11'&&process.platform!=='win32'?'swiftshader':preferred);
}
export function outputPath(projectRoot,filename){
  const folder=workspacePath('outputs',path.basename(projectRoot));
  fs.mkdirSync(folder,{recursive:true});
  return path.join(folder,filename);
}
