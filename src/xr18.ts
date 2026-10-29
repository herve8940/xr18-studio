import dgram from "node:dgram";
import { EventEmitter } from "node:events";
import { decodeOsc, decodeXAirMeterBlob, encodeOsc, oscFloat, type OutgoingOscArg, type OscMessage } from "./osc.js";

export type Mode = "simulation" | "real";
export interface ChannelState { channel: number; fader: number; on: boolean; updatedAt: string | null }
export class XR18 extends EventEmitter {
  private currentMode: Mode;
  get mode(): Mode { return this.currentMode; }
  private socket?: dgram.Socket;
  private timer?: NodeJS.Timeout;
  private host: string;
  private port: number;
  private writes: boolean;
  private connected = false;
  private lastReplyAt: number | null = null;
  private readonly staleAfterMs = 18000;
  private readonly channels = new Map<number, ChannelState>();
  private meters:{channels:number[];updatedAt:string}|null=null;
  meterState(){return this.meters?{...this.meters,available:true}:{channels:[],updatedAt:null,available:false};}
  private readonly advanced = new Map<string,{value:number|string;updatedAt:string}>();
  private readonly advancedAddresses = new Set<string>();
  private main: ChannelState = {channel:0,fader:0.5,on:true,updatedAt:null};
  constructor(opts: { mode: Mode; host: string; port: number; enableWrites: boolean }) {
    super(); this.currentMode = opts.mode; this.host = opts.host; this.port = opts.port;
    this.writes = opts.mode === "real" && opts.enableWrites;
    for (let i = 1; i <= 16; i++) this.channels.set(i, { channel: i, fader: 0.5, on: true, updatedAt: null });
    if (this.mode === "simulation") this.connected = true;
    for(let ch=1;ch<=16;ch++){
      const prefix=`/ch/${String(ch).padStart(2,"0")}`;
      for(const suffix of ["eq/on","eq/1/f","eq/1/g","eq/1/q","eq/2/f","eq/2/g","eq/2/q","eq/3/f","eq/3/g","eq/3/q","eq/4/f","eq/4/g","eq/4/q","dyn/on","dyn/thr","dyn/ratio","dyn/attack","dyn/release","gate/on","gate/thr","gate/attack","gate/release","mix/01/level","mix/02/level","mix/03/level","mix/04/level","mix/05/level","mix/06/level"]){this.advancedAddresses.add(`${prefix}/${suffix}`);}
    }
    for(let i=1;i<=4;i++)this.advancedAddresses.add(`/fx/${i}/type`);
  }
  status() { const live=this.mode==="simulation"||this.isLive(); return { mode: this.mode, connected: live, writesEnabled: this.writes, port:this.port, host: this.mode === "real" ? this.host : undefined, lastReplyAt:this.lastReplyAt?new Date(this.lastReplyAt).toISOString():null, lastValuesAreVerified: live&&this.mode==="real" }; }
  private isLive(){return this.connected&&this.lastReplyAt!==null&&Date.now()-this.lastReplyAt<this.staleAfterMs;}
  listChannels() { return [...this.channels.values()]; }
  mainState() { return {...this.main}; }
  advancedState(channel?:number){const prefix=channel===undefined?"":`/ch/${String(channel).padStart(2,"0")}/`;return Object.fromEntries([...this.advanced].filter(([address])=>address.startsWith(prefix)));}
  refreshAdvanced(channel:number){if(!Number.isInteger(channel)||channel<1||channel>16)throw Error("Channel must be 1..16");if(this.mode!=="real"||!this.isLive())return;const prefix=`/ch/${String(channel).padStart(2,"0")}/`;for(const address of this.advancedAddresses)if(address.startsWith(prefix))this.send(address);}
  /** Direct OSC write, explicit operator opt-in; never update local state until hardware echoes. */
  writeAdvanced(address:string,value:number){
    if(this.mode!=="real"||!this.writes||!this.isLive())throw Error("Real XR18 connection and write opt-in required");
    if(!this.advancedAddresses.has(address))throw Error("OSC parameter not allowlisted");
    if(!Number.isFinite(value))throw Error("Invalid numeric value");
    const eq=/^\/ch\/(0[1-9]|1[0-6])\/eq\/(?:[1-4]\/([fgq])|on)$/.exec(address);
    const dyn=/^\/ch\/(0[1-9]|1[0-6])\/(dyn|gate)\/(on|thr|ratio|attack|release)$/.exec(address);
    const send=/^\/ch\/(0[1-9]|1[0-6])\/mix\/0[1-6]\/level$/.test(address);
    // The X-Air OSC protocol uses normalized floats for continuous parameters.
    // Toggle writes use OSC integer; processing ranges must be validated on real hardware.
    const isToggle=address.endsWith("/on");
    if(isToggle){if(value!==0&&value!==1)throw Error("Toggle must be 0 or 1");}
    else if(!(eq||dyn||send)||value<0||value>1)throw Error("Only normalized 0..1 processing and send writes supported");
    if(address.startsWith("/fx/"))throw Error("FX algorithm writes require hardware verification");
    this.send(address,[isToggle?value:oscFloat(value)]);
    this.emit("advanced-write-requested",{address,value,at:new Date().toISOString()});
  }
  refreshFx(){if(this.mode!=="real"||!this.isLive())return;for(const address of this.advancedAddresses)if(address.startsWith("/fx/"))this.send(address);}
  async start(): Promise<void> {
    if (this.mode === "simulation") return;
    this.socket = dgram.createSocket("udp4");
    this.socket.on("message", (data, rinfo) => {
      if (rinfo.address !== this.host || rinfo.port !== this.port) return;
      try { this.handle(decodeOsc(data)); } catch (err) { this.emit("warning", String(err)); }
    });
    const transport=this.socket;
    this.socket.on("error", err => { if(this.socket!==transport)return; this.connected = false; this.emit("connection",{connected:false}); this.emit("warning", err.message); });
    await new Promise<void>((resolve, reject) => {
      this.socket!.once("listening", resolve);
      this.socket!.once("error", reject);
      this.socket!.bind(0);
    });
    // XR18 remote update subscription; refresh every 8s (subscription nominally 10s).
    this.send("/xremote");
    this.send("/meters",["/meters/1",2]);
    this.timer = setInterval(() => {this.send("/xremote");this.send("/meters",["/meters/1",2]); this.send("/lr/mix/fader"); if(this.connected&&!this.isLive()){this.connected=false;this.emit("connection",{connected:false});}}, 8000);
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
    this.emit("osc-reply",msg);
    if(msg.address==="/meters/1"&&Buffer.isBuffer(msg.args[0])){
      const levels=decodeXAirMeterBlob(msg.args[0],40);
      this.meters={channels:levels.slice(0,16),updatedAt:new Date().toISOString()};
      this.connected=true;this.lastReplyAt=Date.now();this.emit("meters",this.meterState());return;
    }
    const match = /^\/ch\/(0[1-9]|1[0-6])\/mix\/(fader|on)$/.exec(msg.address);
    if (!match) {
      if(this.advancedAddresses.has(msg.address)&&(typeof msg.args[0]==="number"||typeof msg.args[0]==="string")){
        const state={value:msg.args[0],updatedAt:new Date().toISOString()};this.advanced.set(msg.address,state);this.connected=true;this.lastReplyAt=Date.now();this.emit("advanced",{address:msg.address,...state});return;
      }
      if ((msg.address === "/lr/mix/fader" || msg.address === "/lr/mix/on") && typeof msg.args[0] === "number") {
        if(msg.address.endsWith("/fader") && msg.args[0]>=0 && msg.args[0]<=1) this.main.fader=msg.args[0];
        else if(msg.address.endsWith("/on")) this.main.on=msg.args[0]!==0;
        else return;
        this.main.updatedAt=new Date().toISOString();this.connected=true;this.lastReplyAt=Date.now();this.emit("main",{...this.main});
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
    this.connected = true; this.lastReplyAt=Date.now();
    this.emit("state", { ...state });
  }
  /** 0..1 normalized fader, not dB. Read-only unless explicit real-write opt-in. */
  setFader(channel: number, value: number) {
    if (!Number.isInteger(channel) || channel < 1 || channel > 16) throw new Error("Channel must be 1..16");
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error("Fader must be 0..1");
    if (this.mode === "real" && !this.writes) throw new Error("Hardware writes disabled");
    if (this.mode === "real" && !this.isLive()) throw new Error("Console state stale or disconnected; refusing write");
    if (this.mode === "real") this.send(`/ch/${String(channel).padStart(2, "0")}/mix/fader`, [oscFloat(value)]);
    else { const state = this.channels.get(channel)!; state.fader = value; state.updatedAt = new Date().toISOString(); this.emit("state", { ...state }); }
  }
  setOn(channel:number,on:boolean) {
    if(!Number.isInteger(channel)||channel<1||channel>16)throw Error("Channel must be 1..16");
    if(typeof on!=="boolean")throw Error("Boolean on required");
    if(this.mode==="real"&&(!this.writes||!this.isLive()))throw Error("Hardware writes disabled or console not confirmed");
    if(this.mode==="real")this.send(`/ch/${String(channel).padStart(2,"0")}/mix/on`,[on?1:0]);
    else {const state=this.channels.get(channel)!;state.on=on;state.updatedAt=new Date().toISOString();this.emit("state",{...state});}
  }
  setMainFader(value:number){
    if(!Number.isFinite(value)||value<0||value>1)throw Error("Main fader must be 0..1");
    if(this.mode==="real"&&(!this.writes||!this.isLive()))throw Error("Hardware writes disabled or console not confirmed");
    if(this.mode==="real")this.send("/lr/mix/fader",[oscFloat(value)]);
    else {this.main.fader=value;this.main.updatedAt=new Date().toISOString();this.emit("main",{...this.main});}
  }
  setMainOn(on:boolean){
    if(typeof on!=="boolean")throw Error("Boolean on required");
    if(this.mode==="real"&&(!this.writes||!this.isLive()))throw Error("Hardware writes disabled or console not confirmed");
    if(this.mode==="real")this.send("/lr/mix/on",[on?1:0]);
    else {this.main.on=on;this.main.updatedAt=new Date().toISOString();this.emit("main",{...this.main});}
  }
  restoreAdvanced(values:Record<string,{value:number|string;updatedAt:string}>){
    if(this.mode!=='simulation')throw Error('Simulation uniquement');
    for(const [address,state] of Object.entries(values))if(!this.advancedAddresses.has(address)||!Number.isFinite(Number(state.value)))throw Error('Paramètre avancé invalide');
    this.advanced.clear();for(const [address,state] of Object.entries(values)){this.advanced.set(address,structuredClone(state));this.emit('advanced',{address,...state});}
  }
  setMonitor(bus:number,channel:number,value:number){
    const address=`/ch/${String(channel).padStart(2,'0')}/mix/${String(bus).padStart(2,'0')}/level`;
    if(this.mode==='real')this.writeAdvanced(address,value);else {const state={value,updatedAt:new Date().toISOString()};this.advanced.set(address,state);this.emit('advanced',{address,...state});}
  }
  async query(address:string):Promise<OscMessage>{
    if(this.mode!=="real"||!this.isLive())throw Error("XR18 déconnectée");
    return new Promise((resolve,reject)=>{const done=(msg:OscMessage)=>{if(msg.address!==address)return;clearTimeout(timer);this.off("osc-reply",done);resolve(msg);};const timer=setTimeout(()=>{this.off("osc-reply",done);reject(Error("Pas de réponse XR18 : "+address));},1500);this.on("osc-reply",done);this.send(address);});
  }
  async node(path:string):Promise<string>{
    if(this.mode!=='real'||!this.isLive())throw Error('XR18 déconnectée');
    return new Promise((resolve,reject)=>{const done=(msg:OscMessage)=>{const text=msg.args.find(a=>typeof a==='string'&&a.startsWith(path+' '));if(typeof text!=='string')return;clearTimeout(timer);this.off('osc-reply',done);resolve(text.trim());};const timer=setTimeout(()=>{this.off('osc-reply',done);reject(Error('Nœud XR18 absent : '+path));},1000);this.on('osc-reply',done);this.send('/node',[path.slice(1)]);});
  }
  async applyNative(commands:{address:string;type:'f'|'i'|'s';value:number|string}[]){
    if(process.env.XR18_EXPERIMENTAL_SCENES!=="true"||!this.writes||!this.isLive())throw Error('Rappel matériel expérimental désactivé ou XR18 déconnectée');
    for(const c of commands){if(!this.isLive())throw Error('Rappel interrompu : XR18 déconnectée, état potentiellement partiel');this.send(c.address,[c.type==='f'?oscFloat(c.value as number):c.value]);await new Promise(resolve=>setTimeout(resolve,5));}
  }
  async applyFx(f:{slot:number;algorithm:number;parameters:{type:'f'|'i';value:number}[]}){
    if(process.env.XR18_EXPERIMENTAL_FX!=="true")throw Error("FX matériels expérimentaux désactivés ; validation physique requise");
    if(!this.writes||!this.isLive())throw Error("Écritures désactivées ou XR18 déconnectée");
    const write=async(address:string,value:number,type:'f'|'i')=>{if(!this.isLive())throw Error("XR18 déconnectée pendant application FX");this.send(address,[type==='f'?oscFloat(value):value]);await new Promise(resolve=>setTimeout(resolve,40));const reply=await this.query(address);if(typeof reply.args[0]!=="number"||Math.abs(reply.args[0]-value)>0.0001)throw Error("FX partiellement envoyé : lecture différente sur "+address);};
    await write(`/fx/${f.slot}/type`,f.algorithm,'i');
    for(const [i,p] of f.parameters.entries())await write(`/fx/${f.slot}/par/${String(i+1).padStart(2,'0')}`,p.value,p.type);
  }
  /** Keep the same instance so scenes, API and subscriptions follow the new transport. */
  async reconnect(opts: {mode: Mode; host: string; port: number; enableWrites: boolean}) {
    this.close();
    this.currentMode=opts.mode;this.host=opts.host;this.port=opts.port;
    this.writes=opts.mode==='real'&&opts.enableWrites;
    this.lastReplyAt=null;this.meters=null;this.advanced.clear();
    for(let i=1;i<=16;i++)this.channels.set(i,{channel:i,fader:.5,on:true,updatedAt:null});
    this.main={channel:0,fader:.5,on:true,updatedAt:null};
    this.connected=opts.mode==='simulation';
    this.emit('reset');this.emit('connection');
    try { await this.start(); } catch(e) { this.close();this.emit('connection');throw e; }
  }
  close() {
    if(this.timer)clearInterval(this.timer);this.timer=undefined;
    const socket=this.socket;this.socket=undefined;
    if(socket){socket.removeAllListeners('message');try{socket.close();}catch{}}
    this.connected=false;
  }
}


