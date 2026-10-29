import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DiagnosticLog} from '../src/diagnostics.js';
import {permitted,type User} from '../src/access.js';
test('diagnostics rotate bounded files, export both generations and restrict access',()=>{
 const directory=mkdtempSync(join(tmpdir(),'xr18-log-'));
 try{
  const path=join(directory,'logs','xr18-studio.log'),log=new DiagnosticLog(path,180);
  log.write('old',{message:'a'.repeat(70)});log.write('current',{message:'b'.repeat(70)});
  assert.ok(log.read().includes('old'));assert.ok(log.read().includes('current'));
  log.write('newest',{message:'c'.repeat(70)});assert.ok(!log.read().includes('old'));assert.ok(log.read().includes('newest'));
  if(process.platform!=='win32')assert.equal(statSync(path).mode&0o777,0o600);
  for(const role of ['guest','musician'] as const){const user:User={id:'u',name:'u',role,buses:[1]};assert.equal(permitted(user,'GET','/api/diagnostics/log'),false);}
  assert.equal(permitted({id:'a',name:'a',role:'admin',buses:[]},'GET','/api/diagnostics/log'),true);
  const blocker=join(directory,'file');writeFileSync(blocker,'x');const failed=new DiagnosticLog(join(blocker,'log'));assert.doesNotThrow(()=>failed.write('event'));assert.throws(()=>failed.read(),/ne peut pas être écrit/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
