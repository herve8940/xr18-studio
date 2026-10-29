import {test} from 'node:test';
import assert from 'node:assert/strict';
import {channelCopyAddresses,readChannelCopy,COPY_SECTIONS} from '../src/channel-copy.js';
import {ConsoleControl} from '../src/console-control.js';
import {consoleFeatures} from '../src/console-features.js';
import {LibraryStore} from '../src/library-store.js';
import {PARAMETERS} from '../src/parameters.js';
import {XR18} from '../src/xr18.js';
import {inSection} from '../web/src/console-sections.js';

test('copy selection covers the requested processing without copying physical inputs or shared inserts',()=>{
 const pairs=channelCopyAddresses(1,16,[...COPY_SECTIONS]);
 assert.ok(pairs.length>80);
 for(const pair of pairs){
  assert.ok(PARAMETERS[pair.from]);assert.ok(PARAMETERS[pair.to]);
  assert.ok(pair.from.startsWith('/ch/01/'));assert.ok(pair.to.startsWith('/ch/16/'));
  assert.doesNotMatch(pair.from,/headamp|preamp|config|insert/);
 }
 for(const source of [0,17,1.5,'1',null])assert.throws(()=>channelCopyAddresses(source,2,['eq']));
 assert.throws(()=>channelCopyAddresses(1,1,['eq']));
 assert.throws(()=>channelCopyAddresses(1,2,[]));
 assert.throws(()=>channelCopyAddresses(1,2,['phantom']));
 assert.throws(()=>channelCopyAddresses(1,2,'eq'));
});

test('copy previews before writing, preserves routing/gain and refuses a changed destination',async()=>{
 const xr=new XR18({mode:'simulation',host:'127.0.0.1',port:10024,enableWrites:false});
 const library=new LibraryStore(':memory:'),control=new ConsoleControl(xr,library);
 try{
  await xr.writeParameter('/ch/01/eq/1/g',.8);
  await xr.writeParameter('/ch/02/eq/1/g',.3);
  await xr.writeParameter('/headamp/02/gain',.2);
  await xr.writeParameter('/ch/02/config/insrc',5);
  const values=await readChannelCopy(xr,1,2,['eq']);
  assert.equal(await xr.readParameter('/ch/02/eq/1/g'),.3);
  const preview=await control.preview(values,true);
  assert.ok(preview.changes.every(c=>c.address.startsWith('/ch/02/eq/')));
  await control.apply(preview.token);
  assert.equal(await xr.readParameter('/ch/02/eq/1/g'),.8);
  assert.equal(await xr.readParameter('/headamp/02/gain'),.2);
  assert.equal(await xr.readParameter('/ch/02/config/insrc'),5);
  assert.equal(library.list('parameter-backup').length,1);
  const second=await control.preview(values,true);
  await xr.writeParameter('/ch/02/eq/1/g',.4);
  await assert.rejects(control.apply(second.token),/État modifié/);
 }finally{xr.close();library.close();}
});

test('interrupted channel read does not produce an applicable copy',async()=>{
 const xr=new XR18({mode:'simulation',host:'127.0.0.1',port:10024,enableWrites:false});
 const original=xr.readParameter.bind(xr);let count=0;
 xr.readParameter=async address=>{const result=await original(address);if(++count===2)xr.cancelOperations();return result;};
 try{await assert.rejects(readChannelCopy(xr,1,2,['eq']),/Connexion modifiée/);}finally{xr.close();}
});

test('console sections separate main mix from sends and expose bus graphic EQ and automix',()=>{
 assert.equal(inSection('/ch/01/mix/01/level','sends'),true);
 assert.equal(inSection('/ch/01/mix/10/level','sends'),true);
 assert.equal(inSection('/ch/01/mix/fader','sends'),false);
 assert.equal(inSection('/ch/01/mix/01/level','mix'),false);
 assert.equal(inSection('/ch/01/mix/on','mix'),true);
 assert.equal(inSection('/bus/1/geq/1k','geq'),true);
 assert.equal(inSection('/ch/01/automix/group','automix'),true);
 assert.equal(inSection('/ch/01/dyn/filter/f','dyn'),true);
});

test('feature inventory exposes outstanding functions without claiming hardware qualification',()=>{
 const report=consoleFeatures();assert.equal(report.hardwareValidated,false);
 assert.equal(report.parameterCount,Object.keys(PARAMETERS).length);
 for(const feature of report.features)for(const prefix of feature.prefixes)
  assert.ok(Object.keys(PARAMETERS).some(a=>a.startsWith(prefix)),prefix);
 assert.equal(report.features.find(f=>f.id==='audio')?.status,'external');
 assert.equal(report.features.find(f=>f.id==='midi')?.status,'pending');
 assert.equal(report.features.find(f=>f.id==='rta')?.status,'controls');
});
