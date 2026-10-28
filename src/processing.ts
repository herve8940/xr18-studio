export type EqBand={frequencyHz:number;gainDb:number;q:number;type:"peak"|"lowShelf"|"highShelf"};
export type ProcessingState={channel:number;hpfHz:number|null;eq:EqBand[];compressor:{enabled:boolean;thresholdDb:number|null;ratio:number;attackMs:number;releaseMs:number;makeupDb:number;targetReductionDb:string};gate:{enabled:boolean;mode:"gate"|"expander";thresholdDb:number|null;attackMs:number;holdMs:number;releaseMs:number;rangeDb:number};revision:number;updatedAt:string|null};
export type ProcessingInput=Omit<ProcessingState,"channel"|"revision"|"updatedAt">;
const finite=(v:unknown,min:number,max:number)=>typeof v==="number"&&Number.isFinite(v)&&v>=min&&v<=max;
function checkKeys(v:unknown,keys:string[]):v is Record<string,unknown>{return !!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k))&&keys.every(k=>k in v);}
export function validateProcessing(v:unknown):ProcessingInput{
 if(!checkKeys(v,["hpfHz","eq","compressor","gate"]))throw Error("Invalid processing payload");
 if(v.hpfHz!==null&&!finite(v.hpfHz,20,400))throw Error("HPF must be 20–400 Hz or null");
 if(!Array.isArray(v.eq)||v.eq.length!==4)throw Error("Exactly four EQ bands required");
 for(const b of v.eq){if(!checkKeys(b,["frequencyHz","gainDb","q","type"])||!finite(b.frequencyHz,20,20000)||!finite(b.gainDb,-15,15)||!finite(b.q,.1,10)||!["peak","lowShelf","highShelf"].includes(String(b.type)))throw Error("Invalid EQ band");}
 const c=v.compressor;if(!checkKeys(c,["enabled","thresholdDb","ratio","attackMs","releaseMs","makeupDb","targetReductionDb"])||typeof c.enabled!=="boolean"||(c.thresholdDb!==null&&!finite(c.thresholdDb,-90,0))||!finite(c.ratio,1,20)||!finite(c.attackMs,.1,200)||!finite(c.releaseMs,10,3000)||!finite(c.makeupDb,-18,18)||typeof c.targetReductionDb!=="string"||c.targetReductionDb.length>50)throw Error("Invalid compressor");
 const g=v.gate;if(!checkKeys(g,["enabled","mode","thresholdDb","attackMs","holdMs","releaseMs","rangeDb"])||typeof g.enabled!=="boolean"||!["gate","expander"].includes(String(g.mode))||(g.thresholdDb!==null&&!finite(g.thresholdDb,-90,0))||!finite(g.attackMs,.1,200)||!finite(g.holdMs,0,2000)||!finite(g.releaseMs,10,3000)||!finite(g.rangeDb,0,80))throw Error("Invalid gate");
 return v as unknown as ProcessingInput;
}
export class ProcessingStore{
 restore(states:ProcessingState[]){const previous=new Map(this.states);this.states.clear();this.history.clear();for(const p of states){const desired=validateProcessing({hpfHz:p.hpfHz,eq:p.eq,compressor:p.compressor,gate:p.gate});this.states.set(p.channel,{...desired,channel:p.channel,revision:(previous.get(p.channel)?.revision??0)+1,updatedAt:new Date().toISOString()});}}
 private states=new Map<number,ProcessingState>();
 private history=new Map<number,ProcessingState[]>();
 private checked(channel:number){if(!Number.isInteger(channel)||channel<1||channel>16)throw Error("Channel must be 1..16");}
 get(channel:number){this.checked(channel);return this.states.get(channel)??null;}
 list(){return [...this.states.values()];}
 preview(channel:number,input:unknown){this.checked(channel);const desired=validateProcessing(input);return {channel,current:this.get(channel),desired,hardwareWrite:false};}
 apply(channel:number,input:unknown,expectedRevision:number|null){this.checked(channel);const desired=validateProcessing(input);const old=this.states.get(channel);if((old?.revision??0)!==expectedRevision)throw Error("Revision conflict: refresh before applying");
  if(old){const versions=this.history.get(channel)??[];this.history.set(channel,[structuredClone(old),...versions].slice(0,10));}
  const state:ProcessingState={...structuredClone(desired),channel,revision:(old?.revision??0)+1,updatedAt:new Date().toISOString()};this.states.set(channel,state);return state;
 }
 undo(channel:number,expectedRevision:number){this.checked(channel);const old=this.states.get(channel);if(!old||old.revision!==expectedRevision)throw Error("Revision conflict");const versions=this.history.get(channel)??[];const previous=versions.shift();if(!previous)throw Error("No previous revision");this.history.set(channel,versions);const state={...structuredClone(previous),revision:old.revision+1,updatedAt:new Date().toISOString()};this.states.set(channel,state);return state;}
}

