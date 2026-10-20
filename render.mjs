import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.dirname(fileURLToPath(import.meta.url));
const scenes=[];
for(const folder of ['scenes','postproduction']){
  const directory=path.join(root,folder);
  if(!fs.existsSync(directory))continue;
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    if(entry.isDirectory()&&fs.existsSync(path.join(directory,entry.name,'render.mjs'))){
      scenes.push({id:entry.name,directory:path.join(folder,entry.name)});
    }
  }
}
scenes.sort((a,b)=>Number(a.directory.startsWith('postproduction'))-Number(b.directory.startsWith('postproduction'))||a.id.localeCompare(b.id,'en',{numeric:true}));
const [id,...options]=process.argv.slice(2);

if(!id||id==='--list'||id==='list'){
  for(const scene of scenes)console.log(`${scene.id.padEnd(26)} ${scene.directory}`);
  console.log('\nRender: npm run render -- <scene id or number> [--frames=0,60] [--out=path]');
}else{
  const prefix=/^\d+$/.test(id)?id.padStart(2,'0')+'-':null;
  const scene=scenes.find(s=>s.id===id||s.directory===id||(prefix&&s.id.startsWith(prefix)));
  if(!scene){
    console.error('Unknown scene: '+id+'. Run npm run scenes.');process.exitCode=1;
  }else{
    const result=spawnSync(process.execPath,[path.join(root,scene.directory,'render.mjs'),...options],{cwd:root,stdio:'inherit'});
    if(result.error)console.error(result.error.message);
    process.exitCode=result.status??1;
  }
}
