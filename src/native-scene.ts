// Codec adaptation from xair-scene-manager (MIT). See THIRD_PARTY_NOTICES.txt.
import {SCENE_SCHEMA} from './scene-schema.js';
export type SceneCommand={address:string;type:'i'|'f'|'s';value:number|string};
function tokens(line:string){const result:string[]=[];let value='',quote='',started=false,escaped=false;for(const c of line){if(escaped){value+=c;escaped=false;started=true;continue;}if(c==='\\'){escaped=true;continue;}if(quote){if(c===quote)quote='';else value+=c;started=true;continue;}if(c==='"'||c==="'"){quote=c;started=true;}else if(/\s/.test(c)){if(started){result.push(value);value='';started=false;}}else {value+=c;started=true;}}if(quote||escaped)throw Error('Guillemet ou échappement incomplet');if(started)result.push(value);return result;}
function number(token:string){if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)||!Number.isFinite(Number(token)))throw Error('Nombre invalide : '+token);return Number(token);}
function normalized(v:number){if(!Number.isFinite(v)||v<-.00001||v>1.00001)throw Error('Valeur hors plage OSC');return Math.max(0,Math.min(1,v));}
function encode(field:(typeof SCENE_SCHEMA)[string][number],token:string):Omit<SceneCommand,'address'>{
 const {kind,lo=0,hi=1}=field;
 if(kind==='StrC'){if(token.length>80)throw Error('Nom trop long');return {type:'s',value:token};}
 if(kind==='OnOffC'){const word=field.on_word??'ON';if(![word.toUpperCase(),word==='PFL'?'AFL':'OFF'].includes(token.toUpperCase()))throw Error('Interrupteur invalide');return {type:'i',value:token.toUpperCase()===word.toUpperCase()?1:0};}
 if(kind==='EnumC'){let value=field.options!.findIndex(x=>x.toLowerCase()===token.toLowerCase());if(value<0&&/^[+-]?\d+(?:\.\d+)?$/.test(token)){value=field.options!.findIndex(x=>/^\d+(?:\.\d+)?$/.test(x)&&Number(x)===Number(token));if(value<0)value=number(token);}if(!Number.isInteger(value)||value<0||value>=field.options!.length)throw Error('Option inconnue : '+token);return {type:'i',value};}
 if(kind==='BitmaskC'){if(!/^%?[01]{1,4}$/.test(token))throw Error('Masque invalide');return {type:'i',value:parseInt(token.replace('%',''),2)};}
 if(kind==='IntC'){const value=number(token);if(!Number.isInteger(value)||value<0||value>15)throw Error('Couleur invalide');return {type:'i',value};}
 let value:number;
 if(kind==='LevelC'){const db=['-oo','-inf'].includes(token.toLowerCase())?-90:number(token);if(db< -90||db>10)throw Error('Niveau hors plage');value=db>=-10?(db+30)/40:db>=-30?(db+50)/80:db>=-60?(db+70)/160:(db+90)/480;}
 else if(kind==='PanC')value=(number(token)+100)/200;
 else if(kind==='PercentC')value=number(token)/100;
 else if(kind==='EqQC')value=1-Math.log(number(token)/.3)/Math.log(10/.3);
 else if(kind==='LinC')value=(number(token)-lo)/(hi-lo);
 else if(kind==='LogFreqC'||kind==='LogTimeC'){const n=kind==='LogFreqC'&&/^[+-]?\d+[kK]\d*$/.test(token)?number(token.toLowerCase().replace('k','.'))*1000:number(token);value=Math.log(n/lo)/Math.log(hi/lo);}
 else throw Error('Codec non pris en charge');return {type:'f',value:normalized(value)};
}
export function compileNativeScene(text:unknown){
 if(typeof text!=='string'||text.length>900000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text))throw Error('Scène native invalide');
 const commands:SceneCommand[]=[];const opaqueFx:{address:string;tokens:string[]}[]=[];const nodes=new Set<string>();
 for(const line of text.split(/\r?\n/)){if(!line.trim()||line.trim().startsWith('#'))continue;const [address,...args]=tokens(line);if(!address||nodes.has(address))throw Error('Nœud absent ou dupliqué');nodes.add(address);
  if(/^\/fx\/[1-4]\/par$/.test(address)){if(!args.length||args.length>64)throw Error('Paramètres FX absents ou trop nombreux');opaqueFx.push({address,tokens:args});continue;}
  if(!Object.hasOwn(SCENE_SCHEMA,address))throw Error('Nœud non pris en charge : '+address);const fields=SCENE_SCHEMA[address]!;if(fields.length!==args.length)throw Error('Nombre de champs incorrect : '+address);
  fields.forEach((field,i)=>commands.push({address:address+'/'+(address.endsWith('/geq')?field.leaf.replace(/^geq\//,''):field.leaf),...encode(field,args[i]!)}));
 }
 if(!commands.length&&!opaqueFx.length)throw Error('Scène vide');
 // Algorithms must precede their parameter writes, independent of imported line order.
 commands.sort((a,b)=>Number(/\/fx\/\d\/par\//.test(a.address))-Number(/\/fx\/\d\/par\//.test(b.address)));
 return {commands,opaqueFx,nodes:[...nodes],phantom:commands.filter(c=>c.address.endsWith('/phantom'))};
}
