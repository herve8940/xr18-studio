import test from "node:test";
import assert from "node:assert/strict";
import { XR18 } from "../src/xr18.js";
import { decodeOsc, encodeOsc, oscFloat } from "../src/osc.js";

test("XR18 simulated channel mute toggles and emits state", () => {
  const xr = new XR18({mode:"simulation",host:"127.0.0.1",port:10024,enableWrites:false});
  let changes=0;
  xr.on("state",()=>changes++);
  xr.setOn(1,false);
  assert.equal(xr.listChannels()[0]?.on,false);
  xr.setOn(1,true);
  assert.equal(xr.listChannels()[0]?.on,true);
  assert.equal(changes,2);
  xr.close();
});
test("XR18 simulated master fader and mute emit main state",()=>{
  const xr=new XR18({mode:"simulation",host:"127.0.0.1",port:10024,enableWrites:false});
  let changes=0;xr.on("main",()=>changes++);
  xr.setMainFader(.25);xr.setMainOn(false);
  assert.equal(xr.mainState().fader,.25);
  assert.equal(xr.mainState().on,false);
  assert.equal(changes,2);
  xr.close();
});
test("invalid values and channels are refused",()=>{
  const xr=new XR18({mode:"simulation",host:"127.0.0.1",port:10024,enableWrites:false});
  assert.throws(()=>xr.setOn(0,false));
  assert.throws(()=>xr.setOn(17,false));
  assert.throws(()=>xr.setOn(1,1 as unknown as boolean));
  assert.throws(()=>xr.setMainFader(2));
  assert.throws(()=>xr.setMainFader(Number.NaN));
  xr.close();
});
test("OSC float32 preserves exact integer endpoints",()=>{
  for(const v of [0,1,.5]){
    const parsed=decodeOsc(encodeOsc("/lr/mix/fader",[oscFloat(v)]));
    assert.equal(parsed.args[0],v);
  }
});
