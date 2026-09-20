import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {emptyConfig,effective,changeBinding,resetFunction,readYaml,writeYaml,eventCombo,eventKey} from '../shared/bindings.js';
import {parseCharacterExport} from '../shared/characters.js';
import {loadFile,saveFile,loadGlobal,saveGlobal,loadPresets,savePresets,importCharacters} from '../server/storage.js';
const defaults={version:1,binds:[{function:'Use',key:'E',type:'State',priority:3},{function:'Use',key:'MouseLeft',type:'State'},{function:'MoveUp',key:'W',type:'State'}]};
test('editing a default preserves alternate binding and metadata',()=>{
 const c=emptyConfig(),b=effective(defaults,c)[0];
 const changed=changeBinding(defaults,c,b,{function:'Use',key:'F',type:'State',priority:3});
 assert.deepEqual(effective(defaults,changed).filter(b=>b.function==='Use').map(b=>b.key),['MouseLeft','F']);
 assert.equal(changed.binds.at(-1).priority,3);
 assert.equal(effective(defaults,resetFunction(changed,'Use')).length,3);
});
test('deleting last assignment suppresses defaults and can be restored',()=>{
 let c=emptyConfig();c=changeBinding(defaults,c,effective(defaults,c).find(b=>b.function==='MoveUp'),null);
 assert.deepEqual(c.leaveEmpty,['MoveUp']);assert.equal(effective(defaults,c).length,2);
 c=changeBinding(defaults,c,null,{function:'MoveUp',key:'Up',type:'State'});
 assert.deepEqual(c.leaveEmpty,[]);assert.equal(effective(defaults,c).find(b=>b.function==='MoveUp').key,'Up');
});
test('YAML preserves unknown data, commands, modifiers and empty actions',()=>{
 const config={version:1,custom:{a:42},binds:[{function:'say Привет: "станция" #14',type:'Command',key:'L',mod1:'Control',canRepeat:false,custom:'keep'}],leaveEmpty:['Drop']};
 assert.deepEqual(readYaml(writeYaml(config)),config);
 assert.throws(()=>readYaml('version: 1\nbinds: wrong'));
 assert.throws(()=>readYaml('version: 1\nversion: 1\nbinds: []'));
 assert.throws(()=>writeYaml({version:1,binds:[{key:'Invalid',function:'Use'}]}));
});
test('physical keys, numpad and browser modifiers map to engine names',()=>{
 assert.equal(eventKey('KeyF'),'F');assert.equal(eventKey('Digit1'),'Num1');assert.equal(eventKey('Numpad1'),'NumpadNum1');assert.equal(eventKey('Backquote'),'Tilde');assert.equal(eventKey('Backslash'),'BackSlash');
 assert.deepEqual(eventCombo({code:'KeyF',key:'а',ctrlKey:true,shiftKey:true}),{key:'F',mod1:'Control',mod2:'Shift'});
 assert.equal(eventKey('PrintScreen'),undefined);assert.equal(eventKey('NumpadEnd'), 'NumpadNum1');assert.equal(eventKey('Numpad1', '1', 3), 'NumpadNum1');
 assert.deepEqual(eventCombo({code:'Numpad1',key:'1',location:3,shiftKey:true}),{key:'NumpadNum1',mod1:'Shift'});
});
test('real bundled defaults are valid',async()=>{const d=readYaml(await readFile(new URL('../resources/default-keybinds.yml',import.meta.url),'utf8'));assert.ok(d.binds.length>100)});
test('save creates backup and rejects concurrent disk changes',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'ss14-binding-'));const file=path.join(dir,'keybinds.yml');
 try{const first=await loadFile(file);assert.equal(first.exists,false);await saveFile(file,emptyConfig(),first.revision);const before=await readFile(file,'utf8');const loaded=await loadFile(file);const next={version:1,binds:[{key:'L',type:'Command',function:'me машет.'}],leaveEmpty:[]};const saved=await saveFile(file,next,loaded.revision);assert.equal(await readFile(saved.backup,'utf8'),before);assert.deepEqual((await loadFile(file)).config,next);await writeFile(file,before);await assert.rejects(saveFile(file,next,saved.revision),{status:409});assert.equal(await readFile(file,'utf8'),before);}finally{await rm(dir,{recursive:true,force:true});}
});
test('character profiles migrate to common and role-specific layers',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'ss14-presets-')),file=path.join(dir,'presets.json');
 try{
  const old={Борис:{version:1,character:{name:'Борис',race:'Унатх',department:'engineering',role:'Инженер'},layers:{common:{version:1,binds:[{function:'Use',key:'E'}]},race:{version:1,binds:[{function:'Use',key:'F'}]},role:{version:1,binds:[{function:'Drop',key:'G'}]}}}};
  await writeFile(file,JSON.stringify(old));const migrated=await loadPresets(file),profile=migrated.Борис;
  assert.equal(profile.version,2);assert.equal(profile.character.race,'Унатх');assert.equal(profile.common.binds[0].key,'F');assert.equal(profile.roles['engineering::Инженер'].config.binds[0].key,'G');
  await savePresets(file,migrated);assert.deepEqual(await loadPresets(file),migrated);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('global bindings persist independently from character profiles',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'ss14-global-')),file=path.join(dir,'global.json');
 try{assert.deepEqual(await loadGlobal(file),emptyConfig());const config={version:1,binds:[{function:'say Общий канал',type:'Command',key:'H'}],leaveEmpty:['Drop']};assert.deepEqual(await saveGlobal(file,config),{global:config});assert.deepEqual(await loadGlobal(file),config);}finally{await rm(dir,{recursive:true,force:true})}
});
test('SS220 character exports provide a localized name and race',()=>{
 const exported='forkId: ss220\nversion: 2\nprofile:\n  name: Борис Рейн\n  species: Reptilian\n  age: 31\n';
 assert.deepEqual(parseCharacterExport(exported,'boris.yml'),{name:'Борис Рейн',race:'Унатх',species:'Reptilian',knownSpecies:true,forkId:'ss220',version:2,fileName:'boris.yml'});
 const unknown=parseCharacterExport('version: 1\nprofile:\n  name: Ирис\n  species: NewSpecies\n','iris.yml');
 assert.equal(unknown.race,'Человек');assert.equal(unknown.knownSpecies,false);
 assert.throws(()=>parseCharacterExport('version: 3\nprofile:\n  name: Тест\n','bad.yml'),/неизвестная версия/);
});
test('batch character import preserves existing profiles and skips duplicates',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'ss14-character-import-')),file=path.join(dir,'presets.json');
 try{
  await savePresets(file,{Борис:{version:2,character:{name:'Борис',race:'Человек'},common:{version:1,binds:[{function:'me машет',type:'Command',key:'M'}],leaveEmpty:[]},roles:{}}});
  const result=await importCharacters(file,[{name:'борис',race:'Унатх'},{name:'Ирис',race:'Ниан'}]);
  assert.deepEqual(result.imported,['Ирис']);assert.deepEqual(result.skipped,['борис']);
  assert.equal(result.presets.Борис.common.binds[0].function,'me машет');assert.equal(result.presets.Ирис.character.race,'Ниан');
 }finally{await rm(dir,{recursive:true,force:true})}
});
