import type {XR18} from './xr18.js';
import type {ConsoleControl} from './console-control.js';
import type {LibraryStore} from './library-store.js';

export function snapshotIndex(input:unknown):number{
 if(typeof input!=='number'||!Number.isInteger(input)||input<1||input>64)throw Error('Emplacement de snapshot entre 1 et 64 requis');
 return input;
}
export function snapshotName(input:unknown):string{
 if(typeof input!=='string'||!input.trim()||Buffer.byteLength(input,'utf8')>31||/[\x00-\x1f\x7f]/.test(input))throw Error('Nom de snapshot : 1 à 31 octets sans caractères de contrôle');
 return input;
}
export function snapshotScope(input:unknown):string{
 if(typeof input!=='string'||!/^[-+]{59}$/.test(input))throw Error('Périmètre de snapshot : 59 signes + ou - requis');
 return input;
}
export class HardwareSnapshots{
 constructor(private xr:XR18,private control:ConsoleControl,private library:LibraryStore){}
 async read(input:unknown){
  const index=snapshotIndex(input),path=`/snap/${String(index).padStart(2,'0')}`;
  const name=(await this.xr.query(path+'/name')).args[0];
  if(typeof name!=='string'||Buffer.byteLength(name,'utf8')>31)throw Error('Nom de snapshot reçu invalide');
  const scope=snapshotScope((await this.xr.query(path+'/scope')).args[0]);
  return {index,name,scope};
 }
 async execute(input:Record<string,unknown>){
  const index=snapshotIndex(input.index),action=input.action;
  if(!['save','load','delete','rename','scope'].includes(String(action)))throw Error('Action de snapshot inconnue');
  if(input.confirm!==true)throw Error('Confirmation requise');
  const status=this.xr.status();if(status.mode!=='real'||!status.connected||!status.writesEnabled)throw Error('Contrôle XR18 réel requis');
  if(action==='load'&&input.allowPhantom!==true)throw Error('Un snapshot peut modifier les gains, niveaux et le 48 V : confirmation distincte requise');
  const name=action==='save'||action==='rename'?snapshotName(input.name):undefined;
  const scope=action==='save'||action==='scope'?snapshotScope(input.scope):undefined;
  const operation=this.xr.operationId(),path=`/snap/${String(index).padStart(2,'0')}`;
  const before=await this.read(index);
  if(input.expectedName!==before.name||input.expectedScope!==before.scope)throw Error('Snapshot modifié : relire l’emplacement avant de continuer');
  const current=action==='load'||action==='save'?await this.control.capture():undefined;
  const backup=this.library.save(current?'scene':'snapshot-metadata',`Avant ${String(action)} snapshot ${index}`,current??before);
  const check=()=>{if(operation!==this.xr.operationId())throw Error('Opération snapshot interrompue');};
  try{
   check();
   const latest=await this.read(index);check();
   if(latest.name!==before.name||latest.scope!==before.scope)throw Error('Snapshot modifié pendant la sauvegarde de sécurité : relire l’emplacement');
   if(action==='save'){this.xr.writeSnapshotCommand('/snap/name',name!);check();this.xr.writeSnapshotCommand('/snap/save',index);check();this.xr.writeSnapshotCommand(path+'/scope',scope!);}
   else if(action==='rename')this.xr.writeSnapshotCommand(path+'/name',name!);
   else if(action==='scope')this.xr.writeSnapshotCommand(path+'/scope',scope!);
   else this.xr.writeSnapshotCommand('/snap/'+String(action),index);
   // UDP commands are not acknowledgements. Verify the metadata that the
   // protocol exposes; do not claim that a loaded mix has been fully compared.
   await new Promise(r=>setTimeout(r,100));check();
   if(action==='load'){
    const actual=(await this.xr.query('/snap/index')).args[0];check();
    if(actual!==index)throw Error('Index chargé non confirmé');
    return {ok:true,backupId:backup.id,indexVerified:true,mixReadbackCompared:false};
   }
   const after=await this.read(index);check();
   if((name!==undefined&&after.name!==name)||(scope!==undefined&&after.scope!==scope)||(action==='delete'&&after.name!==''))throw Error('Métadonnées différentes après commande');
   return {ok:true,backupId:backup.id,snapshot:after,mixReadbackCompared:false};
  }catch(e){throw Error(`Snapshot potentiellement modifié ; sauvegarde ${backup.id} : ${(e as Error).message}`);}
 }
}
