import { parseDocument, stringify } from 'yaml';

export const keys = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...Array.from({length:10},(_,i)=>`Num${i}`), ...Array.from({length:10},(_,i)=>`NumpadNum${i}`), ...Array.from({length:24},(_,i)=>`F${i+1}`), ...'MouseLeft MouseRight MouseMiddle MouseButton4 MouseButton5 MouseButton6 MouseButton7 MouseButton8 MouseButton9 Escape Control Shift Alt LSystem RSystem Menu LBracket RBracket SemiColon Comma Period Apostrophe Slash BackSlash Tilde Equal Space Return NumpadEnter BackSpace Tab PageUp PageDown End Home Insert Delete Minus NumpadAdd NumpadSubtract NumpadDivide NumpadMultiply NumpadDecimal Left Right Up Down Pause World1 CapsLock ScrollLock Help Stop Again Props Undo Cut Copy Open Paste Find'.split(' ')];
const keyMap = Object.fromEntries(keys.map(k=>[k.toLowerCase(),k]));
export const canonicalKey = key => keyMap[String(key).toLowerCase()];
export function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.version !== 1 || !Array.isArray(data.binds)) throw new Error('Ожидается YAML с version: 1 и списком binds.');
  if (data.leaveEmpty !== undefined && (!Array.isArray(data.leaveEmpty) || data.leaveEmpty.some(f=>typeof f!=='string'))) throw new Error('leaveEmpty должен быть списком названий функций.');
  for (const [i,b] of data.binds.entries()) {
    if (!b || typeof b.function !== 'string' || !b.function.trim()) throw new Error(`Бинд ${i+1}: укажите действие.`);
    if (!['State','Toggle','Command'].includes(b.type ?? 'State')) throw new Error(`Бинд ${i+1}: неизвестный тип.`);
    if (!canonicalKey(b.key)) throw new Error(`Бинд ${i+1}: неизвестная клавиша ${b.key}.`);
    const combo=[b.key,...['mod1','mod2','mod3'].map(m=>b[m]).filter(k=>k && k!=='Unknown')];
    if (combo.some(k=>!canonicalKey(k)) || new Set(combo.map(k=>canonicalKey(k))).size!==combo.length) throw new Error(`Бинд ${i+1}: некорректное сочетание клавиш.`);
    for(const field of ['canFocus','canRepeat','allowSubCombs','commandWhenUIFocused']) if(b[field]!==undefined && typeof b[field]!=='boolean') throw new Error(`Бинд ${i+1}: ${field} должен быть boolean.`);
    if(b.priority!==undefined && !Number.isInteger(b.priority)) throw new Error(`Бинд ${i+1}: priority должен быть целым числом.`);
  }
  return data;
}
export function readYaml(text) {
  const doc=parseDocument(text, {uniqueKeys:true});
  if(doc.errors.length) throw new Error(doc.errors[0].message);
  return validate(doc.toJS({maxAliasCount:50}));
}
export const writeYaml = data => stringify(validate(data), {lineWidth:0});
export const emptyConfig = () => ({version:1,binds:[],leaveEmpty:[]});
export function effective(defaults, config) {
  const overridden=new Set([...config.binds.map(b=>b.function),...(config.leaveEmpty||[])]);
  return [...defaults.binds.filter(b=>!overridden.has(b.function)).map((b,i)=>({...b,_id:`d${i}`,_source:'default'})), ...config.binds.map((b,i)=>({...b,_id:`u${i}`,_source:'user'}))];
}
export function changeBinding(defaults, config, original, replacement) {
  const next=structuredClone(config);
  const materialize = fn => {
    if (!next.binds.some(b=>b.function===fn) && !(next.leaveEmpty||[]).includes(fn)) next.binds.push(...structuredClone(defaults.binds.filter(b=>b.function===fn)));
  };
  if(original) {
    materialize(original.function);
    const plain=b=>JSON.stringify(Object.fromEntries(Object.entries(b).filter(([k])=>!k.startsWith('_'))));
    const index=original._source==='user' ? Number(original._id.slice(1)) : next.binds.findIndex(b=>plain(b)===plain(original));
    if(index>=0) next.binds.splice(index,1);
    if(!next.binds.some(b=>b.function===original.function) && (original.type!=='Command' || defaults.binds.some(b=>b.function===original.function))) next.leaveEmpty=[...new Set([...(next.leaveEmpty||[]),original.function])];
  }
  if(replacement) {
    next.binds.push(replacement);
    next.leaveEmpty=(next.leaveEmpty||[]).filter(f=>f!==replacement.function);
  }
  return next;
}
export function resetFunction(config, fn) {return {...config,binds:config.binds.filter(b=>b.function!==fn),leaveEmpty:(config.leaveEmpty||[]).filter(f=>f!==fn)};}
export const combination = b => [b.mod1,b.mod2,b.mod3,b.key].filter(k=>k && k!=='Unknown').map(k=>canonicalKey(k)||k);
export const signature = b => combination(b).sort().join('+');
const browserKeys={Backquote:'Tilde',BracketLeft:'LBracket',BracketRight:'RBracket',Semicolon:'SemiColon',Quote:'Apostrophe',Backslash:'BackSlash',IntlBackslash:'World1',Enter:'Return',Backspace:'BackSpace',ArrowLeft:'Left',ArrowRight:'Right',ArrowUp:'Up',ArrowDown:'Down',ControlLeft:'Control',ControlRight:'Control',ShiftLeft:'Shift',ShiftRight:'Shift',AltLeft:'Alt',AltRight:'Alt',MetaLeft:'LSystem',MetaRight:'RSystem',ContextMenu:'Menu',NumpadAdd:'NumpadAdd',NumpadSubtract:'NumpadSubtract',NumpadMultiply:'NumpadMultiply',NumpadDivide:'NumpadDivide',NumpadDecimal:'NumpadDecimal',NumpadInsert:'NumpadNum0',NumpadEnd:'NumpadNum1',NumpadArrowDown:'NumpadNum2',NumpadPageDown:'NumpadNum3',NumpadArrowLeft:'NumpadNum4',NumpadClear:'NumpadNum5',NumpadArrowRight:'NumpadNum6',NumpadHome:'NumpadNum7',NumpadArrowUp:'NumpadNum8',NumpadPageUp:'NumpadNum9'};
export function eventKey(code, keyValue, location) {
  if(/^Key[A-Z]$/.test(code)) return code.slice(3);
  if(/^Digit\d$/.test(code)) return `Num${code.slice(-1)}`;
  if(/^Numpad\d$/.test(code)) return `NumpadNum${code.slice(-1)}`;
  if(location===3 && /^[0-9]$/.test(keyValue)) return `NumpadNum${keyValue}`;
  return browserKeys[code] || canonicalKey(code);
}
export function eventCombo(event, key=eventKey(event.code, event.key, event.location)) {
  if(!key) return null;
  if(['Control','Shift','Alt','LSystem','RSystem'].includes(key)) return null;
  const mods=[event.ctrlKey&&'Control',event.shiftKey&&'Shift',event.altKey&&'Alt',event.metaKey&&'LSystem'].filter(k=>k && k!==key);
  if(mods.length>3) return null;
  return {key,...Object.fromEntries(mods.map((m,i)=>[`mod${i+1}`,m]))};
}
