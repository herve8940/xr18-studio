import {diagnostic} from './diagnostics.js';
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
  if(msg.address!=='/info'&&msg.address!=='/xinfo')return null;
  if(msg.args.length<3||typeof msg.args[1]!=='string'||typeof msg.args[2]!=='string'||!['XR18','XR18V2'].includes(msg.args[2].trim().toUpperCase()))return null;
  return {host,port,name:msg.args[1].trim()||'XR18',model:'XR18'};
 }catch{return null;}
}
/** Optional targets/port are for deterministic UDP transport tests. HTTP never accepts them. */
export interface DiscoveryDiagnostics {received:number;unrecognized:number;sendErrors:string[]}
export async function discoverXR18(timeoutMs=2500,targets=broadcastTargets(),port=10024,diagnostics:DiscoveryDiagnostics={received:0,unrecognized:0,sendErrors:[]}):Promise<DiscoveredXR18[]> {
 diagnostic('discovery.start',{targets,port,timeoutMs});
 if(!targets.length){diagnostic('discovery.no_interfaces');return [];}
 const socket=dgram.createSocket('udp4');const found=new Map<string,DiscoveredXR18>();
 let timer:ReturnType<typeof setTimeout>|undefined;
 let retry:ReturnType<typeof setInterval>|undefined;
 try{
  return await new Promise<DiscoveredXR18[]>((resolve,reject)=>{
   socket.on('error',error=>{diagnostic('discovery.socket_error',{message:error.message});reject(error);});
   socket.on('message',(data,remote)=>{
    if(remote.port!==port)return;
    diagnostics.received++;
    if(diagnostics.received<=32){
     let decoded:unknown;
     try{const msg=decodeOsc(data);decoded={address:msg.address,tags:msg.tags,args:msg.args.slice(0,8).map(v=>Buffer.isBuffer(v)?'[blob]':typeof v==='string'?v.slice(0,256):v)};}catch(error){decoded={error:String(error).slice(0,256)};}
     diagnostic('discovery.reply',{host:remote.address,port:remote.port,bytes:data.length,hex:data.subarray(0,1024).toString('hex'),decoded});
    }
    const device=parseIdentity(data,remote.address,remote.port);
    if(device){found.set(device.host,device);diagnostic('discovery.recognized',{host:device.host,model:device.model});}else diagnostics.unrecognized++;
   });
   socket.bind(0,'0.0.0.0',()=>{
    try{
     socket.setBroadcast(true);
     const probe=()=>{for(const target of targets)for(const address of ['/info','/xinfo'])socket.send(encodeOsc(address),port,target,e=>{if(e&&!diagnostics.sendErrors.includes(e.message))diagnostics.sendErrors.push(e.message);});};
     probe();retry=setInterval(probe,350);
     timer=setTimeout(()=>resolve([...found.values()].sort((a,b)=>a.host.localeCompare(b.host))),Math.max(50,Math.min(timeoutMs,5000)));
    }catch(e){reject(e);}
   });
  });
 }finally{diagnostic('discovery.end',{received:diagnostics.received,unrecognized:diagnostics.unrecognized,sendErrors:diagnostics.sendErrors,found:found.size});if(timer)clearTimeout(timer);if(retry)clearInterval(retry);try{socket.close();}catch{}}
}
