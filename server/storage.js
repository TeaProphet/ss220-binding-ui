import {readFile, mkdir, writeFile, rename, copyFile, unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {emptyConfig, readYaml, writeYaml, validate} from '../shared/bindings.js';
export const revision = text => createHash('sha256').update(text).digest('hex');
export async function loadFile(file) {
  try {const text=await readFile(file,'utf8'); return {config:readYaml(text),revision:revision(text),exists:true};}
  catch(error) {if(error.code==='ENOENT') return {config:emptyConfig(),revision:revision(''),exists:false}; throw error;}
}
export async function saveFile(file,config,expected) {
  const text=writeYaml(config);
  const current=await loadFile(file);
  if(current.revision!==expected) throw Object.assign(new Error('Файл изменён игрой или другим редактором. Экспортируйте свой вариант и перечитайте файл.'),{status:409});
  await mkdir(path.dirname(file),{recursive:true});
  let backup=null;
  if(current.exists) {backup=`${file}.${new Date().toISOString().replace(/[:.]/g,'-')}.${randomUUID().slice(0,8)}.bak`; await copyFile(file,backup);}
  const temp=`${file}.${randomUUID()}.tmp`;
  try {await writeFile(temp,text,{flag:'wx'}); const latest=await loadFile(file); if(latest.revision!==expected) throw Object.assign(new Error('Файл изменился во время сохранения. Перечитайте его.'),{status:409}); await rename(temp,file);}
  finally {await unlink(temp).catch(()=>{});}
  return {revision:revision(text),backup,exists:true};
}

export async function loadPresets(file) {
  try {
    const raw=JSON.parse(await readFile(file,'utf8'));
    if(!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('Файл пресетов должен содержать объект.');
    return Object.fromEntries(Object.entries(raw).map(([name,preset])=>[name,normalizePreset(name,preset)]));
  } catch(error) {
    if(error.code==='ENOENT') return {};
    throw error;
  }
}

export async function savePresets(file,presets) {
  const clean=Object.fromEntries(Object.entries(presets).map(([name,preset])=>{
    const trimmed=String(name).trim();
    if(!trimmed || trimmed.length>80) throw new Error('Имя пресета должно быть от 1 до 80 символов.');
    return [trimmed,normalizePreset(trimmed,preset)];
  }));
  const text=JSON.stringify(clean,null,2)+'\n';
  await mkdir(path.dirname(file),{recursive:true});
  const temp=`${file}.${randomUUID()}.tmp`;
  try {await writeFile(temp,text,{flag:'wx'});await rename(temp,file);} finally {await unlink(temp).catch(()=>{});}
  return {presets:clean};
}

export async function importCharacters(file,characters) {
  if(!Array.isArray(characters)||!characters.length) throw new Error('Выберите хотя бы одного персонажа.');
  const presets=await loadPresets(file),existing=new Set(Object.keys(presets).map(name=>name.toLocaleLowerCase('ru'))),imported=[],skipped=[];
  for(const character of characters) {
    const name=String(character?.name||'').trim(),race=String(character?.race||'Человек').trim()||'Человек';
    if(!name||name.length>80) throw new Error('Имя персонажа должно быть от 1 до 80 символов.');
    const normalized=name.toLocaleLowerCase('ru');
    if(existing.has(normalized)){skipped.push(name);continue}
    presets[name]={version:2,character:{name,race},common:emptyConfig(),roles:{}};
    existing.add(normalized);imported.push(name);
  }
  const result=await savePresets(file,presets);
  return {...result,imported,skipped};
}

export async function loadGlobal(file) {
  try {return validate(JSON.parse(await readFile(file,'utf8')));}
  catch(error) {if(error.code==='ENOENT') return emptyConfig(); throw error;}
}

export async function saveGlobal(file,config) {
  const clean=validate(config),text=JSON.stringify(clean,null,2)+'\n';
  await mkdir(path.dirname(file),{recursive:true});
  const temp=`${file}.${randomUUID()}.tmp`;
  try {await writeFile(temp,text,{flag:'wx'});await rename(temp,file);} finally {await unlink(temp).catch(()=>{});}
  return {global:clean};
}

function mergeConfigs(base,overlay) {
  if(!overlay) return validate(base);
  const a=validate(base),b=validate(overlay);
  const replaced=new Set([...(b.binds||[]).map(bind=>bind.function),...(b.leaveEmpty||[])]);
  return validate({...a,version:1,binds:[...a.binds.filter(bind=>!replaced.has(bind.function)),...b.binds],leaveEmpty:[...new Set([...(a.leaveEmpty||[]).filter(fn=>!replaced.has(fn)),...(b.leaveEmpty||[])])]});
}

function normalizePreset(name,preset) {
  if(!preset || typeof preset!=='object' || Array.isArray(preset)) throw new Error(`Некорректный профиль «${name}».`);
  if(preset.version===2 && preset.common && preset.roles && typeof preset.roles==='object' && !Array.isArray(preset.roles)) {
    const roles=Object.fromEntries(Object.entries(preset.roles).map(([key,entry])=>{
      if(!entry || typeof entry!=='object') throw new Error(`Некорректная должность в профиле «${name}».`);
      return [key,{department:String(entry.department||''),role:String(entry.role||key),config:validate(entry.config)}];
    }));
    return {version:2,character:{...(preset.character||{}),name},common:validate(preset.common),roles};
  }
  if(preset.layers) {
    const common=mergeConfigs(validate(preset.layers.common||emptyConfig()),preset.layers.race);
    const roles={};
    if(preset.layers.role && preset.character?.role) {
      const department=String(preset.character.department||'service');
      const role=String(preset.character.role);
      roles[`${department}::${role}`]={department,role,config:validate(preset.layers.role)};
    }
    return {version:2,character:{...(preset.character||{}),name},common,roles};
  }
  return {version:2,character:{name},common:validate(preset),roles:{}};
}
