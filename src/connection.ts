import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {isIPv4} from 'node:net';
import {XR18,type Mode} from './xr18.js';
import {discoverXR18} from './discovery.js';
export interface ConnectionConfig {mode:Mode;host:string;port:number;enableWrites:boolean}
export function connectionConfig(value:unknown):ConnectionConfig {
 if(!value||typeof value!=='object')throw Error('Configuration de connexion invalide');
 const d=value as Record<string,unknown>;
 if(d.mode!=='real'&&d.mode!=='simulation')throw Error('Mode invalide');
 const host=d.host??'192.168.1.100',port=d.port??10024;
 if(typeof host!=='string'||!isIPv4(host)||host==='0.0.0.0'||Number(host.split('.')[0])>=224)throw Error('Adresse IPv4 invalide');
 if(typeof port!=='number'||!Number.isInteger(port)||port<1||port>65535)throw Error('Port invalide');
 if(d.enableWrites!==undefined&&typeof d.enableWrites!=='boolean')throw Error('Option de contrôle invalide');
 return {mode:d.mode,host,port,enableWrites:d.mode==='real'&&d.enableWrites===true};
}
export async function loadConnection(path:string,fallback:ConnectionConfig){
 try{return connectionConfig(JSON.parse(await readFile(path,'utf8')));}catch{return fallback;}
}
export async function saveConnection(path:string,config:ConnectionConfig){
 await mkdir(dirname(path),{recursive:true});
 await writeFile(path+'.tmp',JSON.stringify(config,null,2),{mode:0o600});await rename(path+'.tmp',path);
}
export class ConnectionManager {
 private busy=false;
 constructor(private xr:XR18,private path:string,private config:ConnectionConfig){}
 async change(input:unknown){
  if(this.busy)throw Error('Connexion déjà en cours');
  const next=connectionConfig(input);this.busy=true;
  const previous=this.config;let switched=false;
  try{
   // Verify identity before touching the running transport. No mixer writes.
   if(next.mode==='real'){
    const devices=await discoverXR18(900,[next.host],next.port);
    if(!devices.some(d=>d.host===next.host))throw Error('La XR18 ne répond pas. Vérifie son alimentation et le réseau local.');
   }
   switched=true;await this.xr.reconnect(next);
   if(next.mode==='real'){
    const end=Date.now()+2500;
    while(!this.xr.status().connected&&Date.now()<end)await new Promise(r=>setTimeout(r,40));
    if(!this.xr.status().connected)throw Error('Console détectée, mais aucune réponse de mixage reçue.');
   }
   await saveConnection(this.path,next);this.config=next;
   return this.xr.status();
  }catch(e){
   // Failed identity probes leave the existing session untouched.
   if(switched){await this.xr.reconnect(previous);}
   throw e;
  }finally{this.busy=false;}
 }
}
