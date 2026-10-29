import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SoundCoach,GROUP_TEMPLATE,validateProfile,identifySymptom,levelReport} from '../src/sound-coach.js';
import {XR18} from '../src/xr18.js';
import {ConsoleControl} from '../src/console-control.js';
import {LibraryStore} from '../src/library-store.js';
import {fromWire} from '../src/parameters.js';
import {EventEmitter} from 'node:events';
const setup=()=>{const xr=new XR18({mode:'simulation',host:'127.0.0.1',port:10024,enableWrites:false}),library=new LibraryStore(':memory:'),control=new ConsoleControl(xr,library);return {xr,library,control,coach:new SoundCoach(xr,control,library)};};
test('beginner group validates wiring and persists progress without changing console',()=>{
 const {xr,library,coach}=setup();try{
  const before=xr.parameterState();const saved=coach.saveProfile({version:1,inputs:GROUP_TEMPLATE,completed:['inputs']});assert.equal(saved.inputs.length,6);assert.deepEqual(coach.profile().completed,['inputs']);assert.deepEqual(xr.parameterState(),before);
  for(const inputs of [[GROUP_TEMPLATE[0],GROUP_TEMPLATE[0]],[{channel:17,source:'lead-rock',name:'chant'}],[{channel:1,source:'unknown',name:'x'}],[{channel:1,source:'lead-rock',name:'a very long instrument'}]])assert.throws(()=>validateProfile({version:1,inputs,completed:[]}));
 }finally{xr.close();library.close();}
});
test('gentle group plan previews only named input treatments, never gain, phantom, levels, unmute or routing',async()=>{
 const {xr,library,coach}=setup();try{
  const initial=xr.parameterState();const plan=await coach.prepare();assert.equal(plan.inputs.length,6);assert.deepEqual(xr.parameterState(),initial);
  assert.ok(plan.changes.length>100);for(const c of plan.changes){assert.match(c.address,/^\/ch\/0[1-6]\//);assert.doesNotMatch(c.address,/headamp|phantom|\/mix\/|routing/);}
  await assert.rejects(coach.apply(plan.token,false),/Confirmation/);await coach.apply(plan.token,true);
  assert.equal(await xr.readParameter('/ch/01/config/name'),'Chant');assert.equal(await xr.readParameter('/ch/01/gate/on'),0);assert.equal(await xr.readParameter('/ch/01/dyn/on'),0);assert.equal(xr.listChannels()[0]?.fader,.5);
  for(let ch=1;ch<=6;ch++)for(let band=1;band<=4;band++){const a=`/ch/${String(ch).padStart(2,'0')}/eq/${band}/g`;assert.ok(Math.abs(Number(fromWire(a,await xr.readParameter(a))))<=2.001);}
  const undo=await coach.undo();await coach.apply(undo.token,true);assert.equal(await xr.readParameter('/ch/01/config/name'),'');assert.equal(await xr.readParameter('/ch/01/gate/on'),1);
 }finally{xr.close();library.close();}
});
test('symptom suggestions are contextual, reversible, bounded and never invent feedback frequency or gate threshold',async()=>{
 const {xr,library,coach}=setup();try{
  await coach.apply((await coach.prepare(1)).token,true);
  const feedback=await coach.suggest(1,'feedback');assert.equal(feedback.proposal,null);assert.equal(feedback.advice.measuredAudio,false);assert.match(feedback.advice.check,/seuls vumètres/);
  const uneven=await coach.suggest(1,'uneven');assert.equal(uneven.proposal,null);
  const r=await coach.suggest(1,'muddy');assert.ok(r.proposal);for(const c of r.proposal.changes)assert.match(c.address,/^\/ch\/01\/eq\/1\//);await coach.apply(r.proposal.token,true);
  assert.ok(Number(fromWire('/ch/01/eq/1/g',await xr.readParameter('/ch/01/eq/1/g')))>=-6);
  await xr.writeParameter('/ch/01/gate/on',1);const cut=await coach.suggest(1,'cutoff');assert.deepEqual(cut.proposal?.changes.map(c=>c.address),['/ch/01/gate/on']);
  await xr.writeParameter('/ch/01/eq/1/type',0);assert.equal((await coach.suggest(1,'muddy')).proposal,null);
  assert.equal(identifySymptom('ma voix est étouffée'),'muddy');assert.equal(identifySymptom('ça siffle très fort'),'feedback');assert.equal(identifySymptom('les fins de mots sont coupées'),'cutoff');assert.equal(identifySymptom('bonjour'),null);
 }finally{xr.close();library.close();}
});
test('signal checks reject missing, duplicated or old samples and simulation never fabricates audio',async()=>{
 const now=Date.now(),sample=(age:number,level:number)=>({updatedAt:new Date(now-age).toISOString(),available:true,channels:[level]});
 assert.equal(levelReport(1,[],now).available,false);assert.equal(levelReport(1,[sample(0,-10),sample(0,-10),sample(0,-10)],now).available,false);assert.equal(levelReport(1,[sample(20000,-10),sample(21000,-10),sample(22000,-10)],now).available,false);
 assert.equal(levelReport(1,[sample(0,-.5),sample(100,-1),sample(200,-2)],now).state,'high');assert.equal(levelReport(1,[sample(0,-60),sample(100,-65),sample(200,-64)],now).state,'low');
 const {xr,library,coach}=setup();try{const report=await coach.measure(1);assert.equal(report.available,false);assert.match(report.message,/ne simule pas/);}finally{xr.close();library.close();}
});

test('level observation collects fresh distinct events, cleans listeners and rejects a changed connection',async()=>{
 const stream=Object.assign(new EventEmitter(),{mode:'real',status:()=>({connected:true})});let identity='console-A';
 const control={identity:()=>identity} as ConsoleControl;const library=new LibraryStore(':memory:');
 const coach=new SoundCoach(stream as unknown as XR18,control,library);
 const measurement=coach.measure(1,250);const now=Date.now();
 for(let n=0;n<3;n++)stream.emit('meters',{available:true,updatedAt:new Date(now-n).toISOString(),channels:[-20]});
 try{const report=await measurement;assert.equal(report.available,true);assert.equal(report.state,'present');assert.equal(stream.listenerCount('meters'),0);
  const pending=coach.measure(1,250);identity='console-B';await assert.rejects(pending,/Connexion modifiée/);assert.equal(stream.listenerCount('meters'),0);
 }finally{library.close();}
});
