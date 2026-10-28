import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeOsc, decodeOsc } from "../src/osc.js";
import { XR18 } from "../src/xr18.js";
test("OSC scalar roundtrip", () => {
  const m = decodeOsc(encodeOsc("/ch/01/mix/fader", [0.5]));
  assert.equal(m.address, "/ch/01/mix/fader"); assert.equal(m.args[0], 0.5);
  assert.deepEqual(decodeOsc(encodeOsc("/test", [1, "hello"])).args, [1, "hello"]);
});
test("simulation updates channel and validates bounds", () => {
  const xr = new XR18({ mode: "simulation", host: "127.0.0.1", port: 10024, enableWrites: false });
  xr.setFader(1, 0.25);
  assert.equal(xr.listChannels()[0]?.fader, 0.25);
  assert.throws(() => xr.setFader(1, 1.1));
  assert.throws(() => xr.setFader(17, 0.5));
});
test("real mode is read-only by default", () => {
  const xr = new XR18({ mode: "real", host: "127.0.0.1", port: 10024, enableWrites: false });
  assert.throws(() => xr.setFader(1, 0.25), /disabled/);
});
