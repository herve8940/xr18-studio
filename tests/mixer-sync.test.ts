import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {XR18} from '../src/xr18.js';
import {ConsoleControl} from '../src/console-control.js';
import {LibraryStore} from '../src/library-store.js';
import {MixerSync} from '../src/mixer-sync.js';
import {permitted} from '../src/access.js';
function fixture(){const dir=mkdtempSync(join(tmpdir(),'xr18-sync-')),library=new LibraryStore(join(dir,'studio.db'));const xr=new XR18({mode:'simulation',host:'127.0.0.1',port:10024,enableWrites:false});const control=new ConsoleControl(xr,library),sync=new MixerSync(xr,control,library);let live=true,writes=true;const base=xr.status.bind(xr);return {xr,library,control,sync,live:()=>{xr.status=()=>({...base(),mode:'real',host:'127.0.0.1',connected:live,writesEnabled:writes});},disconnect:()=>{live=false;},readonly:()=>{writes=false;},close:()=>{xr.close();library.close();rmSync(dir,{recursive:true,force:true});}};}
test('sync keeps a distinct PC snapshot, pulls without writes and sends only previewed differences with backup',async()=>{
 const f=fixture();try{
  f.xr.setFader(1,.2);const saved=await f.sync.savePc();f.xr.setFader(1,.7);f.live();
  const before=JSON.stringify(f.xr.listChannels());const pulled=await f.sync.pull();assert.equal(JSON.stringify(f.xr.listChannels()),before);assert.equal(f.sync.status().sources.length,2);assert.notEqual(saved.id,pulled.id);
  const preview=await f.sync.preview(saved.id);assert.equal(f.xr.listChannels()[0]?.fader,.7);assert.equal(preview.changes.find(c=>c.address==='/ch/01/mix/fader')?.after,-38);
  const result=await f.sync.apply(preview.token,true);assert.equal(f.xr.listChannels()[0]?.fader,.2);assert.equal((f.library.get(result.backupId).data as {values:Record<string,number>}).values['/ch/01/mix/fader'],.7);
  await assert.rejects(()=>f.sync.apply(preview.token,true),/expiré/);
 }finally{f.close();}
});
test('sync refuses changed console state and stale connection previews; 48V is excluded unless separately confirmed',async()=>{
 const f=fixture();try{
  await f.xr.writeParameter('/headamp/01/phantom',1,true);f.xr.setFader(1,.2);const saved=await f.sync.savePc();await f.xr.writeParameter('/headamp/01/phantom',0,true);f.xr.setFader(1,.7);f.live();
  const p=await f.sync.preview(saved.id);assert.equal(p.phantom,false);assert.ok(!p.changes.some(c=>c.address.endsWith('/phantom')));
  f.xr.setFader(2,.6);await assert.rejects(()=>f.sync.apply(p.token,true),/table a changé/);assert.equal(f.xr.listChannels()[0]?.fader,.7);assert.equal(f.library.list('scene').length,0);
  const phantom=await f.sync.preview(saved.id,true);assert.equal(phantom.phantom,true);await assert.rejects(()=>f.sync.apply(phantom.token,true),/48 V/);
  const confirmed=await f.sync.preview(saved.id,true);await f.sync.apply(confirmed.token,true,true);assert.equal(await f.xr.readParameter('/headamp/01/phantom'),1);
  const stale=await f.sync.preview(saved.id);f.xr.emit('reset');await assert.rejects(()=>f.sync.apply(stale.token,true),/expiré/);
  f.readonly();await assert.rejects(()=>f.sync.preview(saved.id),/Activer le contrôle/);await f.sync.pull();f.disconnect();await assert.rejects(()=>f.sync.pull(),/Connecter/);
  for(const role of ['guest','musician'] as const)assert.equal(permitted({id:'u',name:'u',role,buses:[1]},'GET','/api/mixer-sync'),false);
 }finally{f.close();}
});
