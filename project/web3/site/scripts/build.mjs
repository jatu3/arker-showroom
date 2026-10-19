import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
if(fs.existsSync(dist))fs.rmSync(dist,{recursive:true});fs.mkdirSync(dist,{recursive:true});
for(const name of ['index.html','styles.css','app.js','intake.js','config.js','films.json','favicon.svg'])fs.copyFileSync(path.join(root,name),path.join(dist,name));
function copyTree(source,target){fs.mkdirSync(target,{recursive:true});for(const item of fs.readdirSync(source,{withFileTypes:true})){const from=path.join(source,item.name),to=path.join(target,item.name);if(item.isDirectory())copyTree(from,to);else if(!item.name.endsWith('.ttf')&&!['Pretendard.woff2','PretendardUI.woff2'].includes(item.name)) fs.copyFileSync(from,to,fs.constants.COPYFILE_FICLONE);}}
copyTree(path.join(root,'assets'),path.join(dist,'assets'));fs.writeFileSync(path.join(dist,'.nojekyll'),'');console.log('Static build: '+dist);
