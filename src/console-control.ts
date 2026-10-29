import {randomUUID,createHash} from 'node:crypto';
import {PARAMETERS,descriptor,validateWire,toWire,fromWire,defaultWire,type Value} from './parameters.js';
import type {XR18} from './xr18.js';
import type {LibraryStore} from './library-store.js';
export type CompleteScene={version:2;scope:'console';values:Record<string,Value>;fx:Awaited<ReturnType<XR18['readFx']>>[]};
export class ConsoleControl {
 private previews=new Map<string,{values:Record<string,Value>;before:Record<string,Value>;identity:string;expires:number}>();
 constructor(private xr:XR18,private library:LibraryStore){}
 identity(){const s=this.xr.status();return JSON.stringify([s.mode,s.host,s.port,s.writesEnabled]);}
 catalog(prefix:string){return Object.values(PARAMETERS).filter(p=>p.address.startsWith(prefix)).map(p=>({...p,...(this.xr.parameterState()[p.address]?{state:{...this.xr.parameterState()[p.address]!,display:fromWire(p.address,this.xr.parameterState()[p.address]!.value)}}:{})}));}
 validateScene(input:unknown):CompleteScene {
  let s=input as CompleteScene;
  if(!s||s.version!==2||s.scope!=='console'||!s.values||typeof s.values!=='object'||Array.isArray(s.values)||!Object.keys(s.values).length||!Array.isArray(s.fx)||s.fx.length!==4||s.fx.some((f,i)=>f.slot!==i+1))throw Error('Scène complète invalide');
  // Accept PC scenes made by older builds with the misspelled DIM-PFL key.
  s=structuredClone(s);
  if(Object.hasOwn(s.values,'/config/solo/dimplf')){
   if(Object.hasOwn(s.values,'/config/solo/dimpfl')&&s.values['/config/solo/dimpfl']!==s.values['/config/solo/dimplf'])throw Error('Valeurs DIM-PFL contradictoires');
   s.values['/config/solo/dimpfl']=s.values['/config/solo/dimplf']!;delete s.values['/config/solo/dimplf'];
  }
  for(const [a,v] of Object.entries(s.values))validateWire(a,v);
  for(const f of s.fx)if(!Number.isInteger(f.algorithm)||f.algorithm<0||f.algorithm>60||!Array.isArray(f.parameters)||f.parameters.length>64||f.parameters.some(p=>!['i','f'].includes(p.type)||!Number.isFinite(p.value)||(p.type==='f'&&(p.value<0||p.value>1))||(p.type==='i'&&(!Number.isInteger(p.value)||p.value<0||p.value>127))))throw Error('Vecteur FX invalide');
  return structuredClone(s);
 }
 async capture():Promise<CompleteScene>{
  const identity=this.identity(),operation=this.xr.operationId(),values=await this.xr.readConsoleParameters();
  const check=()=>{if(identity!==this.identity()||operation!==this.xr.operationId())throw Error('Connexion modifiée');};
  check();const fx=[];for(let slot=1;slot<=4;slot++){check();fx.push(await this.xr.readFx(slot));}check();
  return {version:2,scope:'console',values,fx};
 }
 async preview(input:unknown,wire=false){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length<1||Object.keys(input).length>500)throw Error('1 à 500 paramètres requis');
  const values:Record<string,Value>={},before:Record<string,Value>={};
  for(const [a,v] of Object.entries(input))values[a]=wire?validateWire(a,v):toWire(a,v);
  const identity=this.identity();
  for(const a of Object.keys(values))before[a]=await this.xr.readParameter(a);
  if(this.previews.size>100)this.previews.clear();const token=randomUUID();
  this.previews.set(token,{values,before,identity,expires:Date.now()+60000});
  return {token,changes:Object.entries(values).map(([address,v])=>({address,before:fromWire(address,before[address]!),after:fromWire(address,v),sensitive:descriptor(address).sensitive})),phantom:Object.keys(values).some(a=>a.endsWith('/phantom'))};
 }
 async apply(token:unknown,allowPhantom=false){
  const p=typeof token==='string'?this.previews.get(token):undefined;
  if(!p||p.expires<Date.now()||p.identity!==this.identity())throw Error('Prévisualisation expirée ou connexion modifiée');
  this.previews.delete(token as string);
  if(Object.keys(p.values).some(a=>a.endsWith('/phantom'))&&!allowPhantom)throw Error('Confirmation 48 V requise');
  for(const [a,v] of Object.entries(p.before)){const current=await this.xr.readParameter(a);if(typeof v==='number'&&typeof current==='number'?Math.abs(v-current)>.003:current!==v)throw Error('État modifié : prévisualiser à nouveau');}
  const backup=this.library.save('parameter-backup','Avant modification console',p.before);
  try{await this.xr.applyParameters(p.values,allowPhantom);return {ok:true,backupId:backup.id,readbackCompared:this.xr.mode==='real'};}
  catch(e){throw Error(`Modification potentiellement partielle ; sauvegarde ${backup.id} : ${(e as Error).message}`);}
 }
 async recall(input:unknown,allowPhantom=false){
  const desired=this.validateScene(input);
  if(Object.keys(desired.values).some(a=>a.endsWith('/phantom'))&&!allowPhantom)throw Error('Confirmation 48 V requise');
  const operation=this.xr.operationId();
  const backup=this.library.save('scene','Sauvegarde complète avant rappel',await this.capture());
  try{
   const values={...desired.values};for(let slot=1;slot<=4;slot++)delete values[`/fx/${slot}/type`];
   // Restore processors before levels, without restoring a transport or credentials.
   const levels=Object.fromEntries(Object.entries(values).filter(([a])=>/\/(fader|level|on)$/.test(a)));
   const settings=Object.fromEntries(Object.entries(values).filter(([a])=>!Object.hasOwn(levels,a)));
   const check=()=>{if(operation!==this.xr.operationId())throw Error('Rappel interrompu');};check();await this.xr.applyParameters(settings,allowPhantom);for(const f of desired.fx){check();await this.xr.applyFx(f);}check();await this.xr.applyParameters(levels,allowPhantom);
   return {ok:true,backupId:backup.id,readbackCompared:this.xr.mode==='real'};
  }catch(e){throw Error(`Rappel potentiellement partiel ; sauvegarde ${backup.id} : ${(e as Error).message}`);}
 }
 fingerprint(){return createHash('sha256').update(JSON.stringify([this.identity(),this.xr.parameterState()])).digest('hex');}
}
