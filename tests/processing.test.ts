import { test } from "node:test";
import assert from "node:assert/strict";
import { ProcessingStore, validateProcessing } from "../src/processing.js";
const valid={hpfHz:100,eq:[{frequencyHz:100,gainDb:-2,q:1,type:"peak"},{frequencyHz:400,gainDb:0,q:1,type:"peak"},{frequencyHz:2000,gainDb:2,q:1,type:"peak"},{frequencyHz:8000,gainDb:1,q:1,type:"highShelf"}],compressor:{enabled:true,thresholdDb:null,ratio:3,attackMs:12,releaseMs:100,makeupDb:0,targetReductionDb:"3–6 dB"},gate:{enabled:false,mode:"expander",thresholdDb:null,attackMs:5,holdMs:80,releaseMs:180,rangeDb:12}};
test("processing payload validates 4 EQ bands",()=>{assert.equal(validateProcessing(valid).eq.length,4);assert.throws(()=>validateProcessing({...valid,eq:[]}));});
test("processing rejects invalid values",()=>{assert.throws(()=>validateProcessing({...valid,hpfHz:999}));assert.throws(()=>validateProcessing({...valid,compressor:{...valid.compressor,ratio:100}}));});
test("processing simulation revisions and rollback",()=>{const store=new ProcessingStore();assert.equal(store.get(1),null);const a=store.apply(1,valid,0);assert.equal(a.revision,1);assert.throws(()=>store.apply(1,valid,0),/conflict/);const b=store.apply(1,{...valid,hpfHz:120},1);assert.equal(b.revision,2);const c=store.undo(1,2);assert.equal(c.hpfHz,100);assert.equal(c.revision,3);});
test("processing rejects invalid channel",()=>{const store=new ProcessingStore();assert.throws(()=>store.preview(17,valid));});
