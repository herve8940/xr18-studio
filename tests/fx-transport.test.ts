import {test} from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import {XR18} from '../src/xr18.js';
import {encodeOsc,decodeOsc,oscFloat} from '../src/osc.js';
test('fake UDP console: exact node match, FX write authorization and typed vector comparison',async()=>{
 const peer=dgram.createSocket('udp4');await new Promise<void>(r=>peer.bind(0,'127.0.0.1',r));const values=new Map<string,number>();let writes=0;
 peer.on('message',(packet,from)=>{const m=decodeOsc(packet);const reply=(a:string,args:Parameters<typeof encodeOsc>[1])=>peer.send(encodeOsc(a,args),from.port,from.address);
  if(m.address==='/node'){reply('/node',['/ch/02/config "Wrong" 1 In02 U02']);setTimeout(()=>reply('/node',['/ch/01/config "Right" 1 In01 U01']),5);return;}
  if(m.address==='/lr/mix/fader'){reply(m.address,[oscFloat(.5)]);return;}
  if(m.address.startsWith('/fx/')){
   if(m.address.endsWith('/par')){if(m.args.length){writes++;values.set('/fx/1/par/01',m.args[0] as number);}else reply(m.address,[oscFloat(values.get('/fx/1/par/01')??0)]);}
   else if(m.args.length){writes++;values.set(m.address,m.args[0] as number);}else reply(m.address,[m.address.endsWith('/type')?values.get(m.address)??0:oscFloat(values.get(m.address)??0)]);
  }
 });
 const xr=new XR18({mode:'real',host:'127.0.0.1',port:peer.address().port,enableWrites:true});const before=process.env.XR18_EXPERIMENTAL_FX;
 try{await xr.start();for(let i=0;i<50&&!xr.status().connected;i++)await new Promise(r=>setTimeout(r,5));assert.ok(xr.status().connected);assert.match(await xr.node('/ch/01/config'),/Right/);
  const readonly=new XR18({mode:'real',host:'127.0.0.1',port:peer.address().port,enableWrites:false});await assert.rejects(readonly.applyFx({slot:1,algorithm:0,parameters:[]}));readonly.close();assert.equal(writes,0);
  process.env.XR18_EXPERIMENTAL_FX='true';await xr.applyFx({slot:1,algorithm:0,parameters:[{type:'f',value:.25}]});assert.equal(writes,2);assert.equal(values.get('/fx/1/par/01'),.25);
 }finally{if(before===undefined)delete process.env.XR18_EXPERIMENTAL_FX;else process.env.XR18_EXPERIMENTAL_FX=before;xr.close();peer.close();}
});

test('physical XR18: FX vector of 64 values with NaN for unused slots is read and written back',async()=>{
 // Answer recorded on an XR18V2 (fw 1.23) for FX1 = VRM: 13 used values then NaN.
 const recorded=[.1,.56,.2245,1,.22,.5,.52,.42,.58,.86,.14,.17];
 const peer=dgram.createSocket('udp4');await new Promise<void>(r=>peer.bind(0,'127.0.0.1',r));const store=new Map<string,number>();
 peer.on('message',(packet,from)=>{const m=decodeOsc(packet);const reply=(a:string,args:Parameters<typeof encodeOsc>[1])=>peer.send(encodeOsc(a,args),from.port,from.address);
  if(m.address==='/lr/mix/fader'){reply(m.address,[oscFloat(.5)]);return;}
  if(m.address==='/fx/1/type'){if(m.args.length)store.set('type',m.args[0] as number);else reply(m.address,[store.get('type')??7]);return;}
  if(m.address==='/fx/1/par'){// raw packet: our encoder refuses NaN, the console does not
   const pad=(t:string)=>{const b=Buffer.from(t+'\0','latin1');return Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);};
   const vals=Buffer.alloc(64*4);recorded.forEach((x,i)=>vals.writeFloatBE(store.get('p'+(i+1))??x,i*4));vals.writeInt32BE(0,12*4);for(let i=13;i<64;i++)vals.writeFloatBE(NaN,i*4);
   peer.send(Buffer.concat([pad('/fx/1/par'),pad(','+'f'.repeat(12)+'i'+'f'.repeat(51)),vals]),from.port,from.address);return;}
  const p=/^\/fx\/1\/par\/(\d\d)$/.exec(m.address);if(p&&m.args.length){store.set('p'+Number(p[1]),Math.round((m.args[0] as number)*50)/50);}
 });
 const xr=new XR18({mode:'real',host:'127.0.0.1',port:peer.address().port,enableWrites:true});const before=process.env.XR18_EXPERIMENTAL_FX;
 try{await xr.start();for(let i=0;i<50&&!xr.status().connected;i++)await new Promise(r=>setTimeout(r,5));
  const fx=await xr.readFx(1);assert.equal(fx.algorithm,7);assert.equal(fx.parameters.length,13,'NaN tail dropped');assert.ok(fx.parameters.every(p=>Number.isFinite(p.value)));
  assert.equal(fx.parameters[12]!.type,'i');
  process.env.XR18_EXPERIMENTAL_FX='true';
  const wanted={slot:1,algorithm:7,parameters:fx.parameters.map((p,i)=>i===1?{...p,value:.333}:p)};
  await xr.applyFx(wanted);// console rounds 0.333 → 0.34: within one step
 }finally{if(before===undefined)delete process.env.XR18_EXPERIMENTAL_FX;else process.env.XR18_EXPERIMENTAL_FX=before;xr.close();peer.close();}
});
