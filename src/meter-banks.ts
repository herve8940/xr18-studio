// Behringer X AIR Remote Control Protocol (firmware 1.11+), pages 3-4.
export const METER_BANKS:Record<string,{name:string;count:number;labels:string[]}>= {
 '/meters/1':{name:'Canaux et mixages',count:40,labels:[...Array.from({length:16},(_,i)=>`Canal ${i+1}`),...Array.from({length:5},(_,i)=>[`Retour stéréo ${i+1} L`,`Retour stéréo ${i+1} R`]).flat(),...Array.from({length:6},(_,i)=>`Bus ${i+1}`),...Array.from({length:4},(_,i)=>`Départ FX ${i+1}`),'Main L','Main R','Monitor L','Monitor R']},
 '/meters/2':{name:'Entrées analogiques et USB',count:36,labels:[...Array.from({length:16},(_,i)=>`Micro ${i+1}`),'Aux L','Aux R',...Array.from({length:18},(_,i)=>`USB ${i+1}`)]},
 '/meters/4':{name:'Analyseur spectral RTA',count:100,labels:Array.from({length:100},(_,i)=>`Bande ${i+1}`)},
 '/meters/5':{name:'Sorties physiques, P16 et USB',count:44,labels:[...Array.from({length:6},(_,i)=>`Aux ${i+1}`),'Main L','Main R',...Array.from({length:16},(_,i)=>`P16 ${i+1}`),...Array.from({length:18},(_,i)=>`USB ${i+1}`),'Casque L','Casque R']},
 '/meters/6':{name:'Réduction de gain',count:39,labels:[...Array.from({length:16},(_,i)=>`Gate ${i+1}`),...Array.from({length:16},(_,i)=>`Compresseur ${i+1}`),...Array.from({length:6},(_,i)=>`Comp. bus ${i+1}`),'Comp. Main']},
 '/meters/7':{name:'Gains automix',count:16,labels:Array.from({length:16},(_,i)=>`Canal ${i+1}`)},
 '/meters/8':{name:'DCA',count:4,labels:Array.from({length:4},(_,i)=>`DCA ${i+1}`)},
};
