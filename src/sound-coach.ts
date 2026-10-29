import {PROCESSING_PRESETS} from './coach-presets.js';
import {fromWire,type Value} from './parameters.js';
import type {XR18} from './xr18.js';
import type {ConsoleControl} from './console-control.js';
import type {LibraryStore} from './library-store.js';

export const SOURCES=[
 {id:'lead-rock',label:'Chant principal',color:1},{id:'backing-vocal',label:'Chœurs',color:1},
 {id:'electric-rhythm',label:'Guitare électrique',color:3},{id:'electric-solo',label:'Guitare solo',color:3},
 {id:'acoustic-guitar',label:'Guitare acoustique',color:3},{id:'bass-di',label:'Basse',color:2},
 {id:'drum-module',label:'Batterie électronique / TD-27',color:4},{id:'kick',label:'Grosse caisse',color:4},
 {id:'snare',label:'Caisse claire',color:4},{id:'toms',label:'Tom',color:4},{id:'hihat',label:'Charleston',color:4},
 {id:'overheads',label:'Cymbales / overhead',color:4},{id:'keys',label:'Clavier / piano',color:5}
];
export type Input={channel:number;source:string;name:string};
export type CoachProfile={version:1;inputs:Input[];completed:string[]};
export const STEPS=[
 {id:'connect',title:'1. Brancher et connecter',text:'Relie le PC et la XR18 au même réseau. Vérifie tes branchements, puis connecte la console. Garde les volumes des enceintes et des in-ear bas pendant la préparation.'},
 {id:'inputs',title:'2. Dire qui est branché où',text:'Choisis la prise utilisée par chaque instrument. Le modèle de groupe ci-dessous est une proposition : compare-le aux câbles avant de préparer les canaux.'},
 {id:'levels',title:'3. Faire jouer un musicien à la fois',text:'Joue ou chante au volume des passages les plus forts. Observe les niveaux pendant quelques secondes. Un niveau reçu ne permet pas, à lui seul, de savoir quel étage sature.'},
 {id:'tone',title:'4. Écouter et corriger un problème',text:'Écoute avec tout le groupe, décris un seul problème et essaie une petite correction. Si le résultat est moins bon, annule le dernier réglage.'},
 {id:'ears',title:'5. Préparer les retours',text:'Dans Retours in-ear, choisis le bus de ton musicien. Demande-lui ce qui manque et ajuste un instrument à la fois. Le pourcentage du fader ne mesure pas le volume reçu à l’oreille.'},
 {id:'save',title:'6. Garder le bon réglage',text:'Quand la balance te convient, sauvegarde une scène complète. Refaire la balance reste nécessaire si les micros, enceintes ou la salle changent.'}
];
export const SYMPTOMS=[
 {id:'muddy',label:'C’est brouillon / la voix est étouffée',answer:'On peut essayer de retirer un peu de bas-médium. Cette petite correction peut laisser plus de place aux autres instruments.',check:'Écoute les mots ou les notes dans le groupe complet, puis annule si le son devient trop maigre.'},
 {id:'harsh',label:'C’est agressif / ça pique',answer:'On peut essayer d’adoucir une zone de présence. Il s’agit d’une hypothèse à écouter, pas d’une fréquence mesurée dans ton son.',check:'Compare à volume d’écoute similaire. Si l’attaque ou les paroles disparaissent, annule.'},
 {id:'boomy',label:'Il y a trop de graves / ça résonne',answer:'Un coupe-bas peut retirer le grondement qui n’appartient pas à cet instrument. Sur la basse ou la grosse caisse, je privilégie une petite baisse ciblée pour garder leur grave utile.',check:'Vérifie aussi la position du micro et des enceintes ; une résonance de salle ne se corrige pas toujours sur un seul canal.'},
 {id:'buried',label:'On ne distingue pas ma voix / mon instrument',answer:'Ne monte pas tout de suite le gain. Vérifie d’abord le micro, la distance et le canal. Demande aux autres de jouer moins fort ou baisse un peu les instruments qui masquent celui-ci.',check:'Compare avec et sans les autres instruments. Si le son est clair seul mais disparaît en groupe, travaille d’abord l’équilibre.',},
 {id:'cutoff',label:'Les fins de mots / notes sont coupées',answer:'Si un gate est actif, on peut le désactiver pour vérifier s’il coupe les sons faibles. Cela peut aussi faire revenir du bruit ou de la repisse.',check:'Chante doucement, tiens une note et laisse-la mourir. Si le problème reste, vérifie aussi le module ou le pédalier en amont.'},
 {id:'uneven',label:'Certaines notes sont beaucoup plus fortes',answer:'Un compresseur peut réduire les écarts, mais son seuil doit être réglé sur ton signal. Commence par vérifier la technique et les niveaux de l’instrument. Je ne choisis pas un seuil au hasard.',check:'Demande au musicien de jouer fort puis doucement. Règle le compresseur dans les contrôles avancés en écoutant, sans compensation automatique de volume.'},
 {id:'dry',label:'La voix est trop sèche / je veux de la reverb',answer:'Une réverbération légère peut aider. Les quatre effets sont partagés : vérifie d’abord le slot, son type et son retour. Je ne remplace pas un effet existant sans connaître son usage.',check:'Choisis ou rappelle un preset dans Effets, puis augmente son envoi très progressivement. Garde les paroles compréhensibles.'},
 {id:'noise',label:'Il y a du souffle / un bourdonnement',answer:'Vérifie d’abord le câble, l’alimentation, la DI et la source. Un gate ne répare pas un câble et peut masquer le problème entre les notes.',check:'Coupe le canal concerné pour localiser le bruit, puis compare avec un autre câble. Ne supprime jamais une terre de protection.'},
 {id:'feedback',label:'Ça siffle / larsen',answer:'Baisse le niveau du canal ou du retour concerné, puis éloigne le micro des enceintes et rapproche-le de la source utile. N’augmente pas le gain pour compenser.',check:'Je ne peux pas identifier la fréquence du larsen avec les seuls vumètres OSC. Ne tente pas de provoquer un larsen pour me le faire détecter.'},
 {id:'clipping',label:'Ça sature / ça grésille',answer:'Repère où apparaît le voyant rouge : instrument, préampli, canal, bus ou sortie. Réduis le niveau à l’étage qui sature. Baisser le master ne répare pas une saturation déjà créée en entrée.',check:'Fais jouer les passages forts. Si le signal de la source est déjà déformé, vérifie le pédalier, le module ou la DI avant la console.'}
];
export const GROUP_TEMPLATE:Input[]=[
 {channel:1,source:'lead-rock',name:'Chant'}, {channel:2,source:'electric-rhythm',name:'Guitare 1'},
 {channel:3,source:'electric-rhythm',name:'Guitare 2'},{channel:4,source:'bass-di',name:'Basse'},
 {channel:5,source:'drum-module',name:'TD27 L'},{channel:6,source:'drum-module',name:'TD27 R'}
];
export function validateProfile(value:unknown):CoachProfile {
 const p=value as CoachProfile;
 if(!p||p.version!==1||!Array.isArray(p.inputs)||p.inputs.length>16||!Array.isArray(p.completed)||p.completed.some(id=>!STEPS.some(s=>s.id===id)))throw Error('Préparation de groupe invalide');
 if(new Set(p.inputs.map(i=>i.channel)).size!==p.inputs.length)throw Error('Une seule source par canal');
 for(const i of p.inputs)if(!i||!Number.isInteger(i.channel)||i.channel<1||i.channel>16||!SOURCES.some(s=>s.id===i.source)||typeof i.name!=='string'||!i.name.trim()||Buffer.byteLength(i.name)>12||/[\x00-\x1f\x7f]/.test(i.name))throw Error('Source, canal 1 à 16 et nom de 12 octets maximum requis');
 return structuredClone(p);
}
export function identifySymptom(text:string){
 const t=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const patterns:[string,RegExp][]=[['feedback',/larsen|siffl/],['clipping',/satur|gresill|distors|rouge/],['cutoff',/coup|fin.*mot|fin.*note/],['noise',/souffle|bourdonn|bruit|buzz/],['harsh',/agress|pique|strident|criard/],['boomy',/grave|resonn|boom/],['muddy',/brouill|etouff|sourd|boueu/],['buried',/entend|disting|masqu|disparai|noye/],['uneven',/ecart|fort.*faible|irreguli|dynamique/],['dry',/reverb|sech|seche|echo/]];
 return patterns.find(([,r])=>r.test(t))?.[0]??null;
}
type MeterSample={updatedAt:string;channels:number[];available:boolean};
export function levelReport(channel:number,samples:MeterSample[],now=Date.now()){
 const unique=new Map(samples.filter(s=>s.available&&Number.isFinite(Date.parse(s.updatedAt))&&now-Date.parse(s.updatedAt)>=0&&now-Date.parse(s.updatedAt)<15000&&typeof s.channels[channel-1]==='number'&&Number.isFinite(s.channels[channel-1])).map(s=>[s.updatedAt,s.channels[channel-1]!]));
 const values=[...unique.values()];if(values.length<3)return {available:false,samples:values.length,state:'unknown',title:'Pas assez de mesures récentes',message:'Aucun diagnostic de niveau fiable. Vérifie la connexion et fais jouer cet instrument pendant le test. Aucun son simulé n’est présenté comme mesuré.'};
 const maximum=Math.max(...values),state=maximum>=-1?'high':maximum< -55?'low':'present';
 return {available:true,samples:values.length,maximumDb:maximum,state,title:state==='high'?'Niveau reçu proche du plafond':state==='low'?'Signal reçu très faible':'Signal présent',message:state==='high'?'Vérifie les voyants et l’étage concerné. Je n’augmente aucun niveau et je ne peux pas localiser la saturation avec cette mesure seule.':state==='low'?'Vérifie le câble, la source et le canal. Cette mesure ne justifie pas une hausse automatique de gain.':'Du signal arrive. Ce résultat ne prouve ni la qualité du timbre, ni le bon équilibre, ni le volume acoustique.'};
}
export class SoundCoach {
 constructor(private xr:XR18,private control:ConsoleControl,private library:LibraryStore){}
 profile():CoachProfile {return this.library.list('coach-profile')[0]?.data as CoachProfile??{version:1,inputs:structuredClone(GROUP_TEMPLATE),completed:[]};}
 saveProfile(input:unknown){const p=validateProfile(input);const saved=this.library.save('coach-profile','Ma préparation',p);return {...p,id:saved.id};}
 catalog(){return {sources:SOURCES,steps:STEPS,symptoms:SYMPTOMS,template:GROUP_TEMPLATE,profile:this.profile(),status:this.xr.status(),aiConfigured:Boolean(process.env.XR18_OPENAI_API_KEY&&process.env.XR18_OPENAI_MODEL)};}
 private input(channel:number){if(!Number.isInteger(channel)||channel<1||channel>16)throw Error('Canal 1 à 16 requis');return this.profile().inputs.find(i=>i.channel===channel);}
 advice(channel:number,symptom:string){
  this.input(channel);const s=SYMPTOMS.find(s=>s.id===symptom);if(!s)throw Error('Choisir un problème proposé');
  return {...s,basis:'description',measuredAudio:false,canSuggest:['muddy','harsh','boomy','cutoff'].includes(symptom)};
 }
 async prepare(channel?:number){
  const profile=validateProfile(this.profile());if(channel!==undefined&&!this.input(channel))throw Error('Attribuer un instrument à ce canal');
  const inputs=profile.inputs.filter(i=>channel===undefined||i.channel===channel);if(!inputs.length)throw Error('Ajouter un instrument');
  const values:Record<string,Value>={};
  for(const i of inputs){
   const p=PROCESSING_PRESETS.find(p=>p.id===i.source)!;const prefix=`/ch/${String(i.channel).padStart(2,'0')}`;
   values[prefix+'/config/name']=i.name;values[prefix+'/config/color']=SOURCES.find(s=>s.id===i.source)!.color;
   values[prefix+'/preamp/hpon']=p.hpfHz===null?0:1;if(p.hpfHz!==null)values[prefix+'/preamp/hpf']=p.hpfHz;
   values[prefix+'/eq/on']=1;p.eq.forEach((b,n)=>{const a=prefix+`/eq/${n+1}`;values[a+'/type']={peak:'PEQ',lowShelf:'LShv',highShelf:'HShv'}[b.type];values[a+'/f']=b.frequencyHz;values[a+'/g']=Math.max(-2,Math.min(2,b.gainDb));values[a+'/q']=b.q;});
   // No blind thresholds: explicitly show that the starting plan disables these processors.
   values[prefix+'/gate/on']=0;values[prefix+'/dyn/on']=0;
  }
  return {...await this.control.preview(values),title:channel?'Une base douce pour cet instrument':'Préparer les instruments du groupe',explanation:'Noms, couleurs, coupe-bas et égalisation légère. Compresseur et gate désactivés pour commencer. Aucun gain d’entrée, fader, mute, panoramique, routage, lien stéréo ou 48 V n’est modifié. Cette base remplace les réglages de traitement concernés ; vérifie la comparaison avant de confirmer.',inputs:inputs.map(i=>i.name)};
 }
 async suggest(channel:number,symptom:string){
  const input=this.input(channel);if(!input)throw Error('Attribuer un instrument à ce canal');
  const advice=this.advice(channel,symptom),prefix=`/ch/${String(channel).padStart(2,'0')}`,values:Record<string,Value>={};
  if(symptom==='cutoff'){
   const on=await this.xr.readParameter(prefix+'/gate/on');if(on!==1)return {advice,proposal:null,message:'Le gate de la XR18 est déjà désactivé. Vérifie le traitement en amont.'};values[prefix+'/gate/on']=0;
  }else if(['muddy','harsh','boomy'].includes(symptom)){
   if(await this.xr.readParameter(prefix+'/eq/on')!==1)return {advice,proposal:null,message:'L’égaliseur est désactivé. Prépare une base connue ou vérifie ses bandes avant de l’activer.'};
   const band=symptom==='harsh'?3:1,frequency=symptom==='harsh'?3200:symptom==='muddy'?280:(input.source==='bass-di'||input.source==='kick'||input.source==='drum-module'?120:180);
   const a=prefix+`/eq/${band}`,gain=Number(fromWire(a+'/g',await this.xr.readParameter(a+'/g')));
   if(await this.xr.readParameter(a+'/type')!==2)return {advice,proposal:null,message:'Cette bande utilise un autre type de filtre. Prépare une base connue plutôt que de modifier ce filtre à l’aveugle.'};
   if(gain<=-6)return {advice,proposal:null,message:'Cette zone est déjà fortement réduite. Écoute et vérifie la source avant de creuser davantage.'};
   if(gain>0){values[a+'/g']=Math.max(0,gain-1.5);}else{values[a+'/f']=frequency;values[a+'/q']=1;values[a+'/g']=Math.max(-6,gain-1.5);}
  }else return {advice,proposal:null,message:'Vérifications d’abord : aucun réglage automatique pertinent pour ce problème avec les seules données OSC.'};
  return {advice,proposal:{...await this.control.preview(values),title:symptom==='cutoff'?'Essayer sans gate':'Essayer une petite correction',explanation:symptom==='cutoff'?'Le gate sera désactivé sur ce canal seulement.':`Une bande EQ du canal sera remplacée pour essayer une réduction ciblée. La fréquence est une hypothèse liée à ta description ; elle n’est pas détectée dans le son.`,inputs:[input.name]}};
 }
 async apply(token:unknown,confirm:unknown){
  if(confirm!==true)throw Error('Confirmation requise');const result=await this.control.apply(token);
  this.library.save('coach-history','Réglage guidé appliqué',{backupId:result.backupId,at:new Date().toISOString()});return result;
 }
 async undo(){
  const last=this.library.list('coach-history')[0];if(!last)throw Error('Aucun réglage guidé à annuler');
  const before=this.library.get((last.data as {backupId:string}).backupId);if(before.kind!=='parameter-backup')throw Error('Sauvegarde incompatible');
  return {...await this.control.preview(before.data,true),title:'Revenir au réglage précédent',explanation:'Seuls les paramètres de la dernière intervention guidée sont restaurés. Compare aussi tes éventuelles modifications manuelles depuis cette intervention.',inputs:[]};
 }
 async measure(channel:number,durationMs=4500){
  if(!this.input(channel))throw Error('Attribuer un instrument à ce canal');
  if(this.xr.mode!=='real'||!this.xr.status().connected)return {available:false,samples:0,state:'unknown',title:'Console réelle nécessaire',message:'Le test ne simule pas de son. Connecte la XR18 pour recevoir ses niveaux.'};
  const identity=this.control.identity(),samples:MeterSample[]=[];
  const listener=(sample:MeterSample)=>{samples.push(structuredClone(sample));};this.xr.on('meters',listener);
  try{await new Promise(r=>setTimeout(r,Math.max(50,Math.min(durationMs,6000))));if(identity!==this.control.identity())throw Error('Connexion modifiée : recommencer le test');return levelReport(channel,samples);}
  finally{this.xr.off('meters',listener);}
 }
}
