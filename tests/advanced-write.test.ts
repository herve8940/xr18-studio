import test from "node:test";
import assert from "node:assert/strict";
import {XR18} from "../src/xr18.js";
test("advanced direct writes fail closed when disconnected",()=>{
 const xr=new XR18({mode:"real",host:"127.0.0.1",port:10024,enableWrites:true});
 assert.throws(()=>xr.writeAdvanced("/ch/01/eq/1/g",0.5),/connection/i);
 xr.close();
});
test("simulation cannot accidentally write real processing",()=>{
 const xr=new XR18({mode:"simulation",host:"127.0.0.1",port:10024,enableWrites:true});
 assert.throws(()=>xr.writeAdvanced("/ch/01/dyn/on",1),/connection/i);
});
