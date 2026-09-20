import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {readYaml} from '../shared/bindings.js';
import {loadFile,saveFile,loadGlobal,saveGlobal,loadPresets,savePresets,importCharacters} from './storage.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||3141);
const file=process.env.SS14_KEYBINDS_PATH || path.join(process.env.APPDATA||path.join(process.env.HOME||root,'.config'),'Space Station 14','data','keybinds.yml');
const presetsFile=process.env.SS14_PRESETS_PATH || path.join(path.dirname(file),'binding-deck-presets.json');
const globalFile=process.env.SS14_GLOBAL_PATH || path.join(path.dirname(file),'binding-deck-global.json');
const defaults=readYaml(await readFile(path.join(root,'resources/default-keybinds.yml'),'utf8'));
const token=randomBytes(32).toString('hex');
const app=express();
app.use((req,res,next)=>{if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)) return res.sendStatus(403); next();});
app.use('/api',express.json({limit:'2mb'}));
app.use('/api',(req,res,next)=>{
  res.set('Cache-Control','no-store');
  if(req.headers.origin && ![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin)) return res.sendStatus(403);
  if(req.method!=='GET' && req.headers['x-editor-token']!==token) return res.sendStatus(403);
  next();
});
app.get('/api/bindings',async(req,res)=>res.json({schemaVersion:2,...await loadFile(file),global:await loadGlobal(globalFile),presets:await loadPresets(presetsFile),defaults,path:file,presetsPath:presetsFile,globalPath:globalFile,token}));
let saving=false;
app.post('/api/bindings',async(req,res,next)=>{if(saving) return res.status(409).json({error:'Сохранение уже выполняется.'}); saving=true; try{res.json(await saveFile(file,req.body.config,req.body.revision));}catch(e){next(e);}finally{saving=false;}});
app.post('/api/presets',async(req,res,next)=>{try{const presets=await loadPresets(presetsFile);const name=String(req.body?.name||'').trim();presets[name]=req.body.config;res.json(await savePresets(presetsFile,presets));}catch(e){next(e);}});
app.post('/api/presets/import',async(req,res,next)=>{try{res.json(await importCharacters(presetsFile,req.body?.characters));}catch(e){next(e);}});
app.post('/api/global',async(req,res,next)=>{try{res.json(await saveGlobal(globalFile,req.body.config));}catch(e){next(e);}});
app.delete('/api/presets/:name',async(req,res,next)=>{try{const presets=await loadPresets(presetsFile);const name=decodeURIComponent(req.params.name);delete presets[name];res.json(await savePresets(presetsFile,presets));}catch(e){next(e);}});
app.post('/api/shutdown',(req,res)=>{res.json({ok:true});setTimeout(()=>process.exit(0),150);});
app.use('/api',(err,req,res,next)=>res.status(err.status||400).json({error:err.message}));
if(process.argv.includes('--production')) {app.use(express.static(path.join(root,'dist'))); app.get('/{*path}',(req,res)=>res.sendFile(path.join(root,'dist/index.html')));}
else {const {createServer}=await import('vite'); const vite=await createServer({root,server:{middlewareMode:true},appType:'spa'}); app.use(vite.middlewares);}
app.listen(port,'127.0.0.1',()=>console.log(`SS220 Binding: http://127.0.0.1:${port}\nФайл игры: ${file}`));
