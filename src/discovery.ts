import dgram from 'node:dgram';
import {networkInterfaces} from 'node:os';
import {isIPv4} from 'node:net';
import {decodeOsc,encodeOsc} from './osc.js';

export interface DiscoveredXR18 {host:string;port:number;name:string;model:'XR18'}
function interfacesSafe(){try{return networkInterfaces();}catch{return {};}}
export function broadcastTargets(interfaces=interfacesSafe()) {
 const targets=new Set<string>();
 for(const addresses of Object.values(interfaces))for(const a of addresses??[]){
  if(a.family!=='IPv4'||a.internal||!isIPv4(a.address)||!isIPv4(a.netmask))continue;
  const ip=a.address.split('.').map(Number), mask=a.netmask.split('.').map(Number);
  if(a.netmask==='255.255.255.255')continue;
  targets.add(ip.map((n,i)=>(n|(~mask[i]!&255))&255).join('.'));
 }
 return [...targets];
}
export function parseIdentity(data:Buffer,host:string,port:number):DiscoveredXR18|null {
 try{
  const msg=decodeOsc(data);
  // X AIR /info: server version, console name, model, firmware.
  if(msg.address!=='/info'||msg.args.length<3||typeof msg.args[1]!=='string'||typeof msg.args[2]!=='string'||msg.args[2].trim().toUpperCase()!=='XR18')return null;
  return {host,port,name:msg.args[1].trim()||'XR18',model:'XR18'};
 }catch{return null;}
}
/** Optional targets/port are for deterministic UDP transport tests. HTTP never accepts them. */
export async function discoverXR18(timeoutMs=2500,targets=broadcastTargets(),port=10024):Promise<DiscoveredXR18[]> {
 if(!targets.length)return [];
 const socket=dgram.createSocket('udp4');const found=new Map<string,DiscoveredXR18>();
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  return await new Promise<DiscoveredXR18[]>((resolve,reject)=>{
   socket.on('error',reject);
   socket.on('message',(data,remote)=>{
    if(remote.port!==port)return;
    const device=parseIdentity(data,remote.address,remote.port);
    if(device)found.set(device.host,device);
   });
   socket.bind(0,'0.0.0.0',()=>{
    try{
     socket.setBroadcast(true);
     for(const target of targets)socket.send(encodeOsc('/info'),port,target,e=>{if(e)reject(e);});
     timer=setTimeout(()=>resolve([...found.values()].sort((a,b)=>a.host.localeCompare(b.host))),Math.max(50,Math.min(timeoutMs,5000)));
    }catch(e){reject(e);}
   });
  });
 }finally{if(timer)clearTimeout(timer);try{socket.close();}catch{}}
}
