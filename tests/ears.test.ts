import {test} from "node:test";
import assert from "node:assert/strict";
import {StudioDatabase} from "../src/database.js";
test("in-ear profiles persist and enforce safe normalized values",()=>{
 const db=new StudioDatabase(":memory:");
 try{
  const levels=Array(16).fill(0.25);
  const p=db.saveEarProfile({musician:"Batteur",bus:3,levels});
  assert.equal(db.listEarProfiles()[0]?.bus,3);
  assert.equal(db.listEarProfiles()[0]?.levels[0],0.25);
  const updated=db.saveEarProfile({id:p.id,musician:"Batteur",bus:3,levels:Array(16).fill(0.5)});
  assert.equal(updated.id,p.id);
  assert.equal(db.listEarProfiles().length,1);
  assert.throws(()=>db.saveEarProfile({musician:"Batteur",bus:7,levels}));
  assert.throws(()=>db.saveEarProfile({musician:"Batteur",bus:3,levels:Array(16).fill(1.5)}));
  assert.equal(db.deleteEarProfile(p.id),true);
 }finally{db.close();}
});
