import {validateProcessing} from './processing.js';
import {toWire,type Value} from './parameters.js';
export function processingCommands(channel:number,input:unknown){
 if(!Number.isInteger(channel)||channel<1||channel>16)throw Error('Canal 1..16 requis');
 const p=validateProcessing(input),prefix=`/ch/${String(channel).padStart(2,'0')}`;
 const values:Record<string,Value>={};
 const set=(suffix:string,value:Value)=>{values[prefix+'/'+suffix]=toWire(prefix+'/'+suffix,value);};
 set('preamp/hpon',p.hpfHz===null?0:1);if(p.hpfHz!==null)set('preamp/hpf',p.hpfHz);set('eq/on',1);
 p.eq.forEach((b,i)=>{set(`eq/${i+1}/type`,{peak:'PEQ',lowShelf:'LShv',highShelf:'HShv'}[b.type]);set(`eq/${i+1}/f`,b.frequencyHz);set(`eq/${i+1}/g`,b.gainDb);set(`eq/${i+1}/q`,b.q);});
 const c=p.compressor,g=p.gate;
 set('dyn/on',c.enabled?1:0);set('dyn/mode','COMP');if(c.thresholdDb!==null)set('dyn/thr',c.thresholdDb);
 // Hardware offers discrete ratios. Show the selected hardware ratio in preview.
 const ratios=[1.1,1.3,1.5,2,2.5,3,4,5,7,10,20,100];const index=ratios.reduce((best,r,i)=>Math.abs(r-c.ratio)<Math.abs(ratios[best]!-c.ratio)?i:best,0);
 set('dyn/ratio',index);set('dyn/attack',c.attackMs);set('dyn/release',c.releaseMs);set('dyn/mgain',c.makeupDb);
 set('gate/on',g.enabled?1:0);set('gate/mode',g.mode==='gate'?'GATE':'EXP2');if(g.thresholdDb!==null)set('gate/thr',g.thresholdDb);
 set('gate/attack',g.attackMs);set('gate/hold',g.holdMs);set('gate/release',g.releaseMs);set('gate/range',g.rangeDb);
 return {values,ratio:ratios[index],preservedThresholds:{compressor:c.thresholdDb===null,gate:g.thresholdDb===null}};
}
