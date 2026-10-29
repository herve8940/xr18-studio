import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import net from 'node:net';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
test('MCP routes confirmed writes through authenticated Studio API, no parallel OSC engine',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'xr18-mcp-'));const probe=net.createServer();await new Promise<void>(r=>probe.listen(0,'127.0.0.1',r));const port=(probe.address() as net.AddressInfo).port;await new Promise<void>(r=>probe.close(()=>r()));
 const db=join(directory,'test.db'),base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['--import','tsx','src/server.ts'],{env:{...process.env,HTTP_PORT:String(port),XR18_DB_PATH:db,XR18_MODE:'simulation'},stdio:'ignore'});
 const client=new Client({name:'bridge-test',version:'1'});
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/api/auth')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,50));}assert.ok(ready);
  await fetch(base+'/api/auth/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'MCPAdmin',password:'mcp-test-password-123'})});
  const env=Object.fromEntries(Object.entries({...process.env,XR18_DB_PATH:db,XR18_STUDIO_URL:base,XR18_STUDIO_USER:'MCPAdmin',XR18_STUDIO_PASSWORD:'mcp-test-password-123'}).filter((x):x is [string,string]=>typeof x[1]==='string'));
  await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/mcp.ts'],env,stderr:'pipe'}));
  const list=await client.listTools();assert.ok(list.tools.find(t=>t.name==='studio_apply_parameters'));
  const status=await client.callTool({name:'studio_console_status',arguments:{}});assert.ok(!status.isError);
  const preview=await client.callTool({name:'studio_preview_parameters',arguments:{values:{'/ch/01/config/name':'MCP test'}}});const token=JSON.parse((preview.content as {text:string}[])[0]!.text).token;
  const refused=await client.callTool({name:'studio_apply_parameters',arguments:{token,confirm:false,allowPhantom:false}});assert.equal(refused.isError,true);
  const applied=await client.callTool({name:'studio_apply_parameters',arguments:{token,confirm:true,allowPhantom:false}});assert.ok(!applied.isError);
  const read=await client.callTool({name:'studio_console_parameters',arguments:{prefix:'/ch/01/config/'}});assert.match(JSON.stringify(read),/MCP test/);
 }finally{await client.close();child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));await rm(directory,{recursive:true,force:true});}
});
