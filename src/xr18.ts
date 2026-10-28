import dgram from "node:dgram";
import { EventEmitter } from "node:events";
import { decodeOsc, encodeOsc, oscFloat, type OutgoingOscArg, type OscMessage } from "./osc.js";

export type Mode = "simulation" | "real";
export interface ChannelState { channel: number; fader: number; on: boolean; updatedAt: string | null }
export class XR18 extends EventEmitter {
  readonly mode: Mode;
  private socket?: dgram.Socket;
  private timer?: NodeJS.Timeout;
  private readonly host: string;
  private readonly port: number;
  private readonly writes: boolean;
  private connected = false;
  private readonly channels = new Map<number, ChannelState>();
  private main: ChannelState = {channel:0,fader:0.5,on:true,updatedAt:null};
  constructor(opts: { mode: Mode; host: string; port: number; enableWrites: boolean }) {
    super(); this.mode = opts.mode; this.host = opts.host; this.port = opts.port;
    this.writes = opts.mode === "real" && opts.enableWrites;
    for (let i = 1; i <= 16; i++) this.channels.set(i, { channel: i, fader: 0.5, on: true, updatedAt: null });
    if (this.mode === "simulation") this.connected = true;
  }
  status() { return { mode: this.mode, connected: this.connected, writesEnabled: this.writes, host: this.mode === "real" ? this.host : undefined, lastValuesAreVerified: false }; }
  listChannels() { return [...this.channels.values()]; }
  mainState() { return {...this.main}; }
  async start(): Promise<void> {
    if (this.mode === "simulation") return;
    this.socket = dgram.createSocket("udp4");
    this.socket.on("message", (data, rinfo) => {
      if (rinfo.address !== this.host || rinfo.port !== this.port) return;
      try { this.handle(decodeOsc(data)); } catch (err) { this.emit("warning", String(err)); }
    });
    this.socket.on("error", err => { this.connected = false; this.emit("warning", err.message); });
    await new Promise<void>((resolve, reject) => {
      this.socket!.once("listening", resolve);
      this.socket!.once("error", reject);
      this.socket!.bind(0);
    });
    // XR18 remote update subscription; refresh every 8s (subscription nominally 10s).
    this.send("/xremote");
    this.timer = setInterval(() => this.send("/xremote"), 8000);
    this.timer.unref();
    this.send("/lr/mix/fader");
    this.send("/lr/mix/on");
    // Request initial values explicitly; OSC push subscriptions may not include initial state.
    for (let i = 1; i <= 16; i++) {
      this.send(`/ch/${String(i).padStart(2, "0")}/mix/fader`);
      this.send(`/ch/${String(i).padStart(2, "0")}/mix/on`);
    }
  }
  private send(address: string, args: OutgoingOscArg[] = []) {
    if (!this.socket) return;
    const b = encodeOsc(address, args);
    this.socket.send(b, this.port, this.host, err => { if (err) this.emit("warning", err.message); });
  }
  private handle(msg: OscMessage) {
    const match = /^\/ch\/(0[1-9]|1[0-6])\/mix\/(fader|on)$/.exec(msg.address);
    if (!match) {
      if ((msg.address === "/lr/mix/fader" || msg.address === "/lr/mix/on") && typeof msg.args[0] === "number") {
        if(msg.address.endsWith("/fader") && msg.args[0]>=0 && msg.args[0]<=1) this.main.fader=msg.args[0];
        else if(msg.address.endsWith("/on")) this.main.on=msg.args[0]!==0;
        else return;
        this.main.updatedAt=new Date().toISOString();this.connected=true;this.emit("main",{...this.main});
      }
      return;
    }
    if (typeof msg.args[0] !== "number") return;
    const channel = Number(match[1]), key = match[2];
    const state = this.channels.get(channel)!;
    if (key === "fader" && msg.args[0] >= 0 && msg.args[0] <= 1) state.fader = msg.args[0];
    else if (key === "on") state.on = msg.args[0] !== 0;
    else return;
    state.updatedAt = new Date().toISOString();
    this.connected = true;
    this.emit("state", { ...state });
  }
  /** 0..1 normalized fader, not dB. Read-only unless explicit real-write opt-in. */
  setFader(channel: number, value: number) {
    if (!Number.isInteger(channel) || channel < 1 || channel > 16) throw new Error("Channel must be 1..16");
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error("Fader must be 0..1");
    if (this.mode === "real" && !this.writes) throw new Error("Hardware writes disabled");
    if (this.mode === "real" && !this.connected) throw new Error("Console state not confirmed; refusing write");
    if (this.mode === "real") this.send(`/ch/${String(channel).padStart(2, "0")}/mix/fader`, [oscFloat(value)]);
    else { const state = this.channels.get(channel)!; state.fader = value; state.updatedAt = new Date().toISOString(); this.emit("state", { ...state }); }
  }
  setOn(channel:number,on:boolean) {
    if(!Number.isInteger(channel)||channel<1||channel>16)throw Error("Channel must be 1..16");
    if(typeof on!=="boolean")throw Error("Boolean on required");
    if(this.mode==="real"&&(!this.writes||!this.connected))throw Error("Hardware writes disabled or console not confirmed");
    if(this.mode==="real")this.send(`/ch/${String(channel).padStart(2,"0")}/mix/on`,[on?1:0]);
    else {const state=this.channels.get(channel)!;state.on=on;state.updatedAt=new Date().toISOString();this.emit("state",{...state});}
  }
  setMainFader(value:number){
    if(!Number.isFinite(value)||value<0||value>1)throw Error("Main fader must be 0..1");
    if(this.mode==="real"&&(!this.writes||!this.connected))throw Error("Hardware writes disabled or console not confirmed");
    if(this.mode==="real")this.send("/lr/mix/fader",[oscFloat(value)]);
    else {this.main.fader=value;this.main.updatedAt=new Date().toISOString();this.emit("main",{...this.main});}
  }
  setMainOn(on:boolean){
    if(typeof on!=="boolean")throw Error("Boolean on required");
    if(this.mode==="real"&&(!this.writes||!this.connected))throw Error("Hardware writes disabled or console not confirmed");
    if(this.mode==="real")this.send("/lr/mix/on",[on?1:0]);
    else {this.main.on=on;this.main.updatedAt=new Date().toISOString();this.emit("main",{...this.main});}
  }
  close() { if (this.timer) clearInterval(this.timer); this.socket?.close(); this.connected = false; }
}
