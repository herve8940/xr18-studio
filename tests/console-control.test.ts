import {test} from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import {XR18} from '../src/xr18.js';
import {PARAMETERS,toWire,fromWire,defaultWire} from '../src/parameters.js';
import {ConsoleControl} from '../src/console-control.js';
import {LibraryStore} from '../src/library-store.js';
import {encodeOsc,decodeOsc,oscFloat,type OutgoingOscArg} from '../src/osc.js';
import {processingCommands} from '../src/processing-osc.js';

test('DIM-PFL uses the hardware address and migrates older PC scenes without mutating the import',async()=>{
 assert.ok(PARAMETERS['/config/solo/dimpfl']);
 assert.equal(PARAMETERS['/config/solo/dimplf'],undefined);
 const xr=new XR18({mode:'simulation',host:'127.0.0.1',port:10024,enableWrites:false}),library=new LibraryStore(':memory:'),control=new ConsoleControl(xr,library);
 try{
  const scene=await control.capture();assert.ok(Object.hasOwn(scene.values,'/config/solo/dimpfl'));
  scene.values['/config/solo/dimplf']=1;delete scene.values['/config/solo/dimpfl'];
  const migrated=control.validateScene(scene);
  assert.equal(migrated.values['/config/solo/dimpfl'],1);assert.equal(migrated.values['/config/solo/dimplf'],undefined);
  assert.equal(scene.values['/config/solo/dimplf'],1);
  scene.values['/config/solo/dimpfl']=0;assert.throws(()=>control.validateScene(scene),/contradictoires/);
 }finally{xr.close();library.close();}
});

test('physical units and integer enums match documented wire formats',()=>{
 assert.equal(toWire('/ch/01/dyn/ratio','4.0'),6);
 assert.equal(toWire('/ch/01/eq/1/g',3),.6);
 assert.equal(toWire('/headamp/01/gain',24),.5);
 assert.ok(Math.abs(Number(fromWire('/ch/01/eq/1/f',toWire('/ch/01/eq/1/f',1000)))-1000)<.001);
 for(const a of ['/routing/usb/01/src','/dca/4/fader','/bus/6/eq/6/g','/rtn/4/mix/fader','/fxsend/4/mix/fader','/lr/dyn/ratio'])assert.ok(PARAMETERS[a],a);
 assert.throws(()=>toWire('/headamp/17/gain',1));assert.throws(()=>toWire('/ch/01/config/name','longer than twelve bytes'));
 assert.throws(()=>toWire('/ch/01/dyn/ratio',.5));assert.throws(()=>toWire('/ch/01/eq/1/f',0));
});

test('complete simulation scene roundtrip covers routing, DCA, names, FX, bus and phantom confirmation',async()=>{
 const xr=new XR18({mode:'simulation',host:'127.0.0.1',port:10024,enableWrites:false}),library=new LibraryStore(':memory:'),control=new ConsoleControl(xr,library);
 try{
  await xr.writeParameter('/ch/01/config/name','Chant');await xr.writeParameter('/dca/2/fader',.4);await xr.writeParameter('/routing/usb/01/src',5);await xr.writeParameter('/bus/1/mix/fader',.2);
  await xr.applyFx({slot:1,algorithm:10,parameters:[{type:'f',value:1},{type:'i',value:1}]});
  const saved=await control.capture();assert.equal(saved.values['/routing/usb/01/src'],5);assert.equal(saved.fx[0]?.parameters[0]?.type,'f');
  await xr.writeParameter('/dca/2/fader',.8);await assert.rejects(control.recall(saved),/48 V/);await control.recall(saved,true);
  assert.equal(await xr.readParameter('/dca/2/fader'),.4);assert.equal(await xr.readParameter('/ch/01/config/name'),'Chant');assert.equal((await xr.readFx(1)).parameters[1]?.type,'i');
  const p=await control.preview({'/ch/01/eq/1/g':3});await xr.writeParameter('/ch/01/eq/1/g',.4);await assert.rejects(control.apply(p.token),/État modifié/);
  const q=await control.preview({'/routing/usb/01/src':7});await control.apply(q.token);assert.equal(await xr.readParameter('/routing/usb/01/src'),7);await assert.rejects(control.apply(q.token));
  assert.ok(library.list('parameter-backup').length);assert.ok(library.list('scene').length);
 }finally{xr.close();library.close();}
});

test('real OSC emulator verifies floats including 0/1, int ratios, names, routing, FX and failed readback',async()=>{
 const peer=dgram.createSocket('udp4');await new Promise<void>(r=>peer.bind(0,'127.0.0.1',r));
 const wire=new Map<string,number|string>(),writes:{address:string;tags?:string}[]=[];let mismatch=false;
 peer.on('message',(data,remote)=>{const m=decodeOsc(data);const reply=(a:string,args:OutgoingOscArg[])=>peer.send(encodeOsc(a,args),remote.port,remote.address);
  if(m.address==='/lr/mix/fader'){reply(m.address,[oscFloat(.5)]);return;}
  if(m.address==='/fx/1/par'){if(m.args.length){writes.push({address:m.address,tags:m.tags});reply(m.address,m.args.map((v,i)=>m.tags?.[i]==='f'?oscFloat(v as number):v));}else reply(m.address,[oscFloat(1),1]);return;}
  if(m.address==='/config/solo/dimplf')return;
  const p=PARAMETERS[m.address];if(!p)return;
  if(m.args.length){writes.push({address:m.address,tags:m.tags});wire.set(m.address,m.args[0] as number|string);}
  const v=mismatch ? .123 :wire.get(m.address)??defaultWire(p);reply(m.address,[p.type==='f'?oscFloat(v as number):v]);
 });
 const xr=new XR18({mode:'real',host:'127.0.0.1',port:peer.address().port,enableWrites:true}),library=new LibraryStore(':memory:'),control=new ConsoleControl(xr,library);
 try{
  await xr.start();for(let i=0;i<100&&!xr.status().connected;i++)await new Promise(r=>setTimeout(r,5));
  const p=await control.preview({'/ch/01/config/name':'Basse','/ch/01/dyn/ratio':'4.0','/ch/01/eq/1/g':15,'/routing/usb/01/src':4});await control.apply(p.token);
  assert.deepEqual(writes.map(w=>w.tags),['s','i','f','i']);assert.equal(wire.get('/ch/01/dyn/ratio'),6);assert.equal(wire.get('/ch/01/eq/1/g'),1);
  const fx=await xr.readFx(1);assert.deepEqual(fx.parameters,[{type:'f',value:1},{type:'i',value:1}]);await xr.applyFx(fx);assert.equal(writes.at(-1)?.tags,'fi');
  assert.equal(await xr.readParameter('/config/solo/dimpfl'),0);
  mismatch=true;await assert.rejects(xr.writeParameter('/ch/01/eq/1/g',.8),/Lecture différente/);
  const before=writes.length;await assert.rejects(xr.writeParameter('/headamp/01/phantom',1),/48 V/);assert.equal(writes.length,before);
  xr.close();await assert.rejects(xr.writeParameter('/dca/1/fader',.5),/déconnectée/);
 }finally{xr.close();library.close();peer.close();}
});
