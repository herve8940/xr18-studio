import {SCENE_NODES} from './scene-nodes.js';
import type {IncomingMessage,ServerResponse} from 'node:http';
import type {XR18} from './xr18.js';
import type {Access,User} from './access.js';
import {LibraryStore} from './library-store.js';
import {ShowControl,validateFx} from './show-control.js';
export async function body(req:IncomingMessage):Promise<Record<string,unknown>>{let raw='';for await(const part of req){raw+=part;if(Buffer.byteLength(raw)>1000000)throw Error('Requête trop volumineuse');}const value:unknown=JSON.parse(raw||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Objet JSON requis');return value as Record<string,unknown>;}
export class StudioApi {
 busy=false;
 constructor(private xr:XR18,private access:Access,private library:LibraryStore,private show:ShowControl){}
 async handle(req:IncomingMessage,res:ServerResponse,path:string,user:User){
 const send=(data:unknown)=>res.end(JSON.stringify(data));
 if(!/^\/api\/(users|audit|library|reacue|monitor)(\/|$)/.test(path))return false;
 try{
  if(path==='/api/users'&&req.method==='GET'){send(this.access.list());return true;}
  if(path==='/api/users'&&req.method==='POST'){const d=await body(req);send(this.access.create(d.name,d.password,d.role,d.buses));return true;}
  if(path==='/api/audit'&&req.method==='GET'){send(this.access.audit());return true;}
  if(path==='/api/library'&&req.method==='GET'){send(['scene','fx','cue','native-scene','fx-backup'].flatMap(k=>this.library.list(k)));return true;}
  if(path==='/api/library/capture-native'&&req.method==='POST'){
   const d=await body(req);if(this.xr.mode!=='real')throw Error('Connexion XR18 réelle requise pour une capture native');
   const lines:string[]=[];for(const node of SCENE_NODES){lines.push(await this.xr.node(node));await new Promise(resolve=>setTimeout(resolve,5));}
   send(this.library.save('native-scene',d.name,lines.join('\n')+'\n'));return true;
  }
  if(path==='/api/library'&&req.method==='POST'){
   const d=await body(req);let value:unknown;
   if(d.kind==='scene')value=d.data===undefined?this.show.capture():this.show.validateScene(d.data);
   else if(d.kind==='fx')value=validateFx(d.data);
   else if(d.kind==='native-scene'){if(typeof d.data!=='string'||d.data.length>900000||!d.data.split('\n').some(l=>l.startsWith('/ch/')))throw Error('Fichier .scn XR18 requis');value=d.data;}
   else if(d.kind==='cue'){const v=d.data as Record<string,unknown>;if(!v||typeof v.songId!=='string'||!v.songId.trim()||v.songId.length>120||typeof v.section!=='string'||!v.section.trim()||v.section.length>120||typeof v.targetId!=='string')throw Error('Morceau, section et cible requis');const target=this.library.get(v.targetId);if(!['scene','fx'].includes(target.kind))throw Error('Cible non rappelable');if(this.library.list('cue').some(e=>{const x=e.data as Record<string,unknown>;return x.songId===v.songId&&x.section===v.section;}))throw Error('Association déjà existante');value={songId:v.songId,section:v.section,targetId:v.targetId};}
   else throw Error('Type inconnu');
   send(this.library.save(d.kind as string,d.name,value));return true;
  }
  const item=/^\/api\/library\/([a-f0-9-]+)(?:\/(preview|apply))?$/.exec(path);
  if(item){const id=item[1]!;if(req.method==='DELETE'&&!item[2]){send({ok:this.library.delete(id)});return true;}if(req.method==='GET'&&!item[2]){send(this.library.get(id));return true;}if(req.method==='POST'&&item[2]==='preview'){send(this.show.preview(id));return true;}if(req.method==='POST'&&item[2]==='apply'){const d=await body(req);this.show.manualOverride();send(await this.show.apply(id,d.token,d.confirm,d.allowPhantom));return true;}}
  if(path==='/api/reacue'&&req.method==='GET'){send(this.show.state());return true;}
  if(path==='/api/reacue/arm'&&req.method==='POST'){const d=await body(req);if(typeof d.armed!=='boolean'||d.confirm!==true)throw Error('Confirmation requise');send(this.show.arm(d.armed));return true;}
  if(path==='/api/reacue/event'&&req.method==='POST'){send(await this.show.event(await body(req)));return true;}
  const monitor=/^\/api\/monitor\/([1-6])\/channels\/(\d+)$/.exec(path);
  if(monitor&&req.method==='POST'){const d=await body(req);if(typeof d.value!=='number'||!Number.isFinite(d.value)||d.value<0||d.value>0.75||!Number.isInteger(Number(monitor[2]))||Number(monitor[2])<1||Number(monitor[2])>16)throw Error('Canal 1..16 et niveau 0..0,75 requis');this.show.manualOverride();this.xr.setMonitor(Number(monitor[1]),Number(monitor[2]),d.value);send({ok:true,hardwareAcknowledged:false});return true;}
  res.writeHead(405);send({error:'Méthode non autorisée'});
 }catch(e){res.writeHead(400);send({error:(e as Error).message});}
 return true;
 }
}
