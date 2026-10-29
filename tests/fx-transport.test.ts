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

