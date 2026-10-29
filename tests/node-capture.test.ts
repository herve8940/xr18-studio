import {test} from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import {XR18} from '../src/xr18.js';
import {SCENE_SCHEMA} from '../src/scene-schema.js';
import {PARAMETERS,toWire,validateWire,fromWire} from '../src/parameters.js';
import {ConsoleControl} from '../src/console-control.js';
import {LibraryStore} from '../src/library-store.js';
import {decodeOsc,encodeOsc,oscFloat,type OutgoingOscArg} from '../src/osc.js';
import {compileNativeScene} from '../src/native-scene.js';
function syntheticNode(node:string){
 const fields=SCENE_SCHEMA[node];if(!fields)return undefined;
 return node+' '+fields.map(f=>{
  if(f.kind==='StrC')return '"Canal"';
  if(f.kind==='EnumC')return node==='/ch/16/config'&&f.leaf==='insrc'?'R':f.options![0];
  if(f.kind==='OnOffC')return f.on_word==='PFL'?'AFL':'OFF';
  if(f.kind==='BitmaskC')return '%0000';
  if(f.kind==='LevelC')return '-oo';
  if(f.kind==='EqQC')return '1.0';
  if(f.kind==='LogFreqC'||f.kind==='LogTimeC'||f.kind==='LinC')return String(f.lo??0);
  return '0';
 }).join(' ');
}
test('Aux USB stereo source uses all nine wire indices and native U1718 maps to eight',()=>{
 const address='/rtn/aux/config/rtnsrc';
 for(let i=0;i<9;i++)assert.equal(validateWire(address,i),i);
 assert.throws(()=>validateWire(address,9));assert.throws(()=>validateWire(address,-1));
 assert.equal(toWire(address,'U0102'),0);assert.equal(toWire(address,'U1718'),8);
 const scene=compileNativeScene('/rtn/aux/config "Aux" 0 U1718');
 assert.equal(scene.commands.find(c=>c.address===address)?.value,8);
 assert.equal(fromWire(address,8),8);
});
test('node capture reads the entire catalogue without unsupported scalar queries, retries loss and never writes',async()=>{
 const peer=dgram.createSocket('udp4');await new Promise<void>(r=>peer.bind(0,'127.0.0.1',r));
 const requests:string[]=[],mutations:string[]=[];let drop=true,broken=false;
 peer.on('message',(data,r)=>{const m=decodeOsc(data),reply=(a:string,args:OutgoingOscArg[])=>peer.send(encodeOsc(a,args),r.port,r.address);
  requests.push(m.address);
  if(m.address==='/node'){
   const node='/'+m.args[0];if(node==='/ch/01/insert'&&drop){drop=false;return;}
   if(broken&&node==='/ch/01/eq/1'){reply('/node',[node+' PEQ']);return;}
   const line=syntheticNode(node);if(line)reply('/node',[line]);return;
  }
  if(m.address==='/lr/mix/fader'){reply(m.address,[oscFloat(.5)]);return;}
  if(/^\/fx\/[1-4]\/type$/.test(m.address)){reply(m.address,[0]);return;}
  if(/^\/fx\/[1-4]\/par$/.test(m.address)){reply(m.address,[oscFloat(.25),1]);return;}
  if(m.args.length&&!['/meters','/xremote'].includes(m.address))mutations.push(m.address);
 });
 const xr=new XR18({mode:'real',host:'127.0.0.1',port:peer.address().port,enableWrites:false}),library=new LibraryStore(':memory:'),control=new ConsoleControl(xr,library);
 try{
  await xr.start();for(let i=0;i<100&&!xr.status().connected;i++)await new Promise(r=>setTimeout(r,5));
  const saved=await control.capture();assert.equal(Object.keys(saved.values).length,Object.keys(PARAMETERS).length);
  assert.equal(saved.values['/ch/16/config/insrc'],17);assert.equal(saved.values['/ch/01/insert/fxslot'],0);
  assert.ok(!requests.includes('/ch/01/insert/fxslot'));assert.equal(saved.fx.length,4);assert.equal(mutations.length,0);
  broken=true;await assert.rejects(control.capture(),/Bloc XR18 incompatible \/ch\/01\/eq\/1/);
 }finally{xr.close();library.close();peer.close();}
});

test('input source R and native block formats are accepted without altering opaque FX tokens',()=>{
 const p=compileNativeScene('/ch/16/config "Canal" 0 R U02\n/ch/01/insert OFF OFF\n/fx/1/par 26 145 ST 1 7k9');
 assert.equal(p.commands.find(c=>c.address==='/ch/16/config/insrc')?.value,17);
 assert.equal(toWire('/ch/16/config/insrc','R'),17);assert.equal(toWire('/ch/16/config/insrc','L'),16);assert.equal(toWire('/ch/16/config/insrc','OFF'),18);
 assert.deepEqual(p.opaqueFx[0]!.tokens,['26','145','ST','1','7k9']);
});

test('insert selector alias is proven by a read before any write and read back using the same address',async()=>{
 const peer=dgram.createSocket('udp4');await new Promise<void>(r=>peer.bind(0,'127.0.0.1',r));let value=0;const writes:string[]=[];
 peer.on('message',(data,r)=>{const m=decodeOsc(data);const reply=(args:OutgoingOscArg[])=>peer.send(encodeOsc(m.address,args),r.port,r.address);
  if(m.address==='/lr/mix/fader'){reply([oscFloat(.5)]);return;}
  if(m.address==='/ch/01/insert/sel'){if(m.args.length){value=Number(m.args[0]);writes.push(m.address);}reply([value]);}
  if(m.address==='/ch/01/insert/fxslot'&&m.args.length)writes.push(m.address);
 });
 const xr=new XR18({mode:'real',host:'127.0.0.1',port:peer.address().port,enableWrites:true});
 try{
  await xr.start();for(let i=0;i<100&&!xr.status().connected;i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(await xr.readParameter('/ch/01/insert/fxslot'),0);assert.equal(writes.length,0);
  await xr.writeParameter('/ch/01/insert/fxslot',1);assert.deepEqual(writes,['/ch/01/insert/sel']);assert.equal(value,1);
 }finally{xr.close();peer.close();}
});
