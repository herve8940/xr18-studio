import test from "node:test";
import assert from "node:assert/strict";
import {decodeOsc,decodeXAirMeterBlob} from "../src/osc.js";
test("X-Air meter bank decodes 40 signed little-endian dBFS readings",()=>{
  const blob=Buffer.alloc(84);blob.writeUInt32LE(40,0);
  blob.writeInt16LE(-20*256,4);blob.writeInt16LE(-6*256,6);
  const values=decodeXAirMeterBlob(blob,40);
  assert.equal(values.length,40);assert.equal(values[0],-20);assert.equal(values[1],-6);
});
test("malformed meter count or truncated blob is rejected",()=>{
  const blob=Buffer.alloc(84);blob.writeUInt32LE(39,0);
  assert.throws(()=>decodeXAirMeterBlob(blob,40));
  assert.throws(()=>decodeXAirMeterBlob(Buffer.alloc(3),40));
});
test("OSC blob argument decodes with padded binary payload",()=>{
  const addr=Buffer.from("/meters/1\0\0\0","binary");
  const tags=Buffer.from(",b\0\0","binary");
  const blob=Buffer.alloc(84);blob.writeUInt32LE(40,0);
  const len=Buffer.alloc(4);len.writeInt32BE(blob.length);
  const decoded=decodeOsc(Buffer.concat([addr,tags,len,blob]));
  assert.equal(decoded.address,"/meters/1");
  assert.ok(Buffer.isBuffer(decoded.args[0]));
  assert.equal(decodeXAirMeterBlob(decoded.args[0] as Buffer,40).length,40);
});

