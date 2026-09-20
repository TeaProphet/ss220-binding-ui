import {parseDocument} from 'yaml';

const speciesNames=new Map(Object.entries({
  human:'Человек',reptilian:'Унатх',unathi:'Унатх',slimeperson:'Слаймолюд',slime:'Слаймолюд',vox:'Вокс',diona:'Дионея',moth:'Ниан',nian:'Ниан',arachnid:'Арахнид',dwarf:'Дворф',ipc:'КПБ',tajaran:'Таяран',tajaranperson:'Таяран',
}));

const field=(value,name)=>value?.[name]??value?.[name[0].toUpperCase()+name.slice(1)];
const cleanSpecies=value=>String(value||'Human').replace(/[^a-z0-9]/gi,'').toLowerCase();

export function parseCharacterExport(text,fileName='profile.yml') {
  const doc=parseDocument(text,{uniqueKeys:true});
  if(doc.errors.length) throw new Error(`${fileName}: ${doc.errors[0].message}`);
  const data=doc.toJS({maxAliasCount:50});
  if(!data||typeof data!=='object'||Array.isArray(data)) throw new Error(`${fileName}: ожидается профиль персонажа SS14.`);
  const version=Number(field(data,'version'));
  if(![1,2].includes(version)) throw new Error(`${fileName}: неизвестная версия профиля.`);
  const profile=field(data,'profile');
  if(!profile||typeof profile!=='object'||Array.isArray(profile)) throw new Error(`${fileName}: отсутствует секция profile.`);
  const name=String(field(profile,'name')||'').trim();
  if(!name) throw new Error(`${fileName}: не найдено имя персонажа.`);
  if(name.length>80) throw new Error(`${fileName}: имя персонажа длиннее 80 символов.`);
  const species=String(field(profile,'species')||'Human');
  const race=speciesNames.get(cleanSpecies(species))||'Человек';
  return {name,race,species,knownSpecies:speciesNames.has(cleanSpecies(species)),forkId:String(field(data,'forkId')||''),version,fileName};
}
