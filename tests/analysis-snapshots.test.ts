import {test} from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import {XR18} from '../src/xr18.js';
import {METER_BANKS} from '../src/meter-banks.js';
import {decodeOsc,encodeOsc,oscFloat,type OutgoingOscArg} from '../src/osc.js';
import {PARAMETERS,defaultWire} from '../src/parameters.js';
import {HardwareSnapshots,snapshotIndex,snapshotName,snapshotScope} from '../src/hardware-snapshots.js';
import {ConsoleControl} from '../src/console-control.js';
import {LibraryStore} from '../src/library-store.js';

test('meter banks receive exact RTA/reduction values and clear across reconnection',async()=>{
 const peer=dgram.createSocket('udp4');await new Promise<void>(r=>peer.bind(0,'127.0.0.1',r));
 let remote:dgram.RemoteInfo|undefined;const subscriptions=new Set<string>();
 peer.on('message',(data,r)=>{remote=r;const m=decodeOsc(data);if(m.address==='/lr/mix/fader')peer.send(encodeOsc(m.address,[oscFloat(.5)]),r.port,r.address);if(m.address==='/meters'&&typeof m.args[0]==='string')subscriptions.add(m.args[0]);});
 const xr=new XR18({mode:'real',host:'127.0.0.1',port:peer.address().port,enableWrites:false});
 const send=(id:string,count:number)=>{const b=Buffer.alloc(4+count*2);b.writeUInt32LE(count);for(let i=0;i<count;i++)b.writeInt16LE((i===0?6:-12)*256,4+i*2);peer.send(encodeOsc(id,[b]),remote!.port,remote!.address);};
 try{
  await xr.start();for(let i=0;i<100&&subscriptions.size<7;i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(subscriptions.size,7);
  for(const [id,spec] of Object.entries(METER_BANKS)){assert.equal(spec.labels.length,spec.count);send(id,spec.count);}
  for(let i=0;i<100&&xr.analysisState().some(b=>!b.available);i++)await new Promise(r=>setTimeout(r,5));
  const rta=xr.analysisState().find(b=>b.id==='/meters/4')!;assert.equal(rta.values.length,100);assert.equal(rta.values[0],6);assert.equal(rta.values[1],-12);
  assert.equal(xr.analysisState().find(b=>b.id==='/meters/6')!.values.length,39);
  const warnings:string[]=[];xr.on('warning',m=>warnings.push(m));send('/meters/4',99);await new Promise(r=>setTimeout(r,20));assert.ok(warnings.length);assert.equal(xr.analysisState().find(b=>b.id==='/meters/4')!.values.length,100);
  const operation=xr.operationId();await xr.reconnect({mode:'simulation',host:'127.0.0.1',port:10024,enableWrites:false});
  assert.notEqual(xr.operationId(),operation);assert.ok(xr.analysisState().every(b=>!b.available&&!b.values.length));
 }finally{xr.close();peer.close();}
});

test('snapshot inputs reject invalid indices, scope lengths and oversized UTF-8 names',()=>{
 for(const i of [0,65,1.5,'1',null])assert.throws(()=>snapshotIndex(i));
 assert.equal(snapshotIndex(64),64);assert.equal(snapshotName('Chant'), 'Chant');
 assert.throws(()=>snapshotName('é'.repeat(16)));assert.throws(()=>snapshotName('x\n'));
 assert.throws(()=>snapshotScope('+'.repeat(58)));assert.throws(()=>snapshotScope('x'.repeat(59)));
 assert.equal(snapshotScope('-'.repeat(59)).length,59);
});

test('native snapshot metadata, save/load guards and readback through UDP emulator',async()=>{
 const peer=dgram.createSocket('udp4');await new Promise<void>(r=>peer.bind(0,'127.0.0.1',r));
 const slot={name:'Ancien',scope:'+'.repeat(59)};let bufferName='',loaded=0;const commands:string[]=[];
 peer.on('message',(data,r)=>{const m=decodeOsc(data),reply=(args:OutgoingOscArg[])=>peer.send(encodeOsc(m.address,args),r.port,r.address);
  if(m.address==='/snap/name'){bufferName=String(m.args[0]);commands.push(m.address);return;}
  if(m.address==='/snap/save'){slot.name=bufferName;commands.push(m.address);return;}
  if(m.address==='/snap/load'){loaded=Number(m.args[0]);commands.push(m.address);return;}
  if(m.address==='/snap/delete'){slot.name='';commands.push(m.address);return;}
  if(m.address==='/snap/index'){reply([loaded]);return;}
  const f=/^\/snap\/01\/(name|scope)$/.exec(m.address);if(f){const key=f[1] as 'name'|'scope';if(m.args.length){slot[key]=String(m.args[0]);commands.push(m.address);}else reply([slot[key]]);return;}
  if(/^\/fx\/[1-4]\/par$/.test(m.address)){reply([oscFloat(0)]);return;}
  const p=PARAMETERS[m.address];if(p){const v=defaultWire(p);reply([p.type==='f'?oscFloat(Number(v)):v]);}
 });
 const xr=new XR18({mode:'real',host:'127.0.0.1',port:peer.address().port,enableWrites:true});
 const library=new LibraryStore(':memory:'),control=new ConsoleControl(xr,library),snapshots=new HardwareSnapshots(xr,control,library);
 try{
  await xr.start();for(let i=0;i<100&&!xr.status().connected;i++)await new Promise(r=>setTimeout(r,5));
  const before=await snapshots.read(1);
  await assert.rejects(snapshots.execute({action:'load',index:1,confirm:true}),/48 V/);assert.equal(commands.length,0);
  await assert.rejects(snapshots.execute({action:'rename',index:1,name:'Nouveau',confirm:true,expectedName:'Périmé',expectedScope:before.scope}),/modifié/);assert.equal(commands.length,0);
  await snapshots.execute({action:'save',index:1,name:'Concert',scope:'-'.repeat(59),confirm:true,expectedName:before.name,expectedScope:before.scope});
  assert.equal(slot.name,'Concert');assert.equal(slot.scope,'-'.repeat(59));assert.equal(library.list('scene').length,1);
  const after=await snapshots.read(1);
  const result=await snapshots.execute({action:'load',index:1,confirm:true,allowPhantom:true,expectedName:after.name,expectedScope:after.scope});
  assert.equal(result.mixReadbackCompared,false);assert.equal(loaded,1);
  assert.throws(()=>xr.writeSnapshotCommand('/headamp/01/phantom',1),/non autorisée/);
  assert.throws(()=>xr.writeSnapshotCommand('/snap/load',65),/invalide/);
  await xr.reconnect({mode:'simulation',host:'127.0.0.1',port:10024,enableWrites:false});
  assert.throws(()=>xr.writeSnapshotCommand('/snap/load',1),/réel requis/);
 }finally{xr.close();library.close();peer.close();}
});
