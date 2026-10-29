import {PARAMETERS} from './parameters.js';

type Feature = {id:string;name:string;status:'controls'|'external'|'pending';detail:string;prefixes:string[]};
const FEATURES:Feature[] = [
 {id:'inputs',name:'Entrées et préamplis',status:'controls',detail:'Gain, 48 V, polarité, coupe-bas, sources analogiques et USB. Le panneau Entrée / Gain identifie le préampli affecté.',prefixes:['/headamp/','/ch/01/preamp/','/ch/01/config/']},
 {id:'mix',name:'Mixage, Aux 17/18 et Main L/R',status:'controls',detail:'Volumes, mutes, panoramiques, affectation au Main, noms et couleurs.',prefixes:['/ch/01/mix/','/rtn/aux/','/lr/']},
 {id:'eq',name:'Égaliseurs',status:'controls',detail:'EQ paramétriques des canaux et sorties ; GEQ/TEQ 31 bandes sur bus et Main.',prefixes:['/ch/01/eq/','/bus/1/eq/','/bus/1/geq/','/lr/geq/']},
 {id:'dynamics',name:'Gate et compresseurs',status:'controls',detail:'Gate, expandeur, ducker, filtres de détection et dynamique des bus/Main.',prefixes:['/ch/01/gate/','/ch/01/dyn/','/bus/1/dyn/','/lr/dyn/']},
 {id:'monitors',name:'Retours de scène',status:'controls',detail:'Six bus, départs individuels, points de prélèvement et liens stéréo.',prefixes:['/ch/01/mix/','/bus/','/config/buslink/']},
 {id:'fx',name:'Effets',status:'controls',detail:'Quatre slots, paramètres OSC typés, départs, retours et insertions. Les paramètres des algorithmes restent numérotés.',prefixes:['/fx/','/fxsend/','/rtn/1/','/ch/01/insert/']},
 {id:'groups',name:'DCA et groupes de mute',status:'controls',detail:'Quatre DCA, quatre groupes de mute et affectations par canal.',prefixes:['/dca/','/config/mute/','/ch/01/grp/']},
 {id:'routing',name:'Routage USB, sorties et Ultranet',status:'controls',detail:'Choix des sources et points de prélèvement pour les sorties physiques, USB et P16.',prefixes:['/routing/']},
 {id:'automix',name:'Automix et liens stéréo',status:'controls',detail:'Groupes X/Y, pondération des canaux, activation/verrouillage et paramètres de liens.',prefixes:['/ch/01/automix/','/config/amixenable/','/config/amixlock/','/config/chlink/','/config/linkcfg/']},
 {id:'monitoring',name:'Écoute casque',status:'controls',detail:'Source, niveau, trim, dim, mono et modes PFL/AFL. Les boutons solo individuels et Solo Clear restent à intégrer.',prefixes:['/config/solo/']},
 {id:'scenes',name:'Scènes et synchronisation',status:'controls',detail:'Scènes JSON complètes, sauvegardes, import/export et synchronisation dans les deux sens. Gestion expérimentale des 64 snapshots internes : nom, périmètre, sauvegarde, rappel et suppression.',prefixes:[]},
 {id:'meters',name:'Vumètres',status:'controls',detail:'Flux reçus de la XR18 : canaux, entrées, sorties, réduction de gain, automix et DCA.',prefixes:[]},
 {id:'audio',name:'Enregistrement audio 18 × 18',status:'external',detail:'Le routage USB est contrôlable ici. Enregistrer/lire les pistes nécessite encore REAPER ou un autre logiciel audio relié en USB.',prefixes:[]},
 {id:'network',name:'Connexion et découverte',status:'controls',detail:'Détection réseau, connexion OSC et reconnexion. La reconfiguration du Wi-Fi interne de la console reste extérieure à cette application.',prefixes:[]},
 {id:'midi',name:'MIDI DIN / USB',status:'pending',detail:'Pas encore de gestionnaire MIDI, de MIDI Learn ou de pont MIDI dans XR18 Studio.',prefixes:[]},
 {id:'rta',name:'Analyseur spectral RTA',status:'controls',detail:'100 bandes, plage réglable, pause et crêtes. Source d’analyse choisie via X AIR Edit ; fréquences exactes des bandes à qualifier.',prefixes:[]},
];
export function consoleFeatures(){return {hardwareValidated:false,parameterCount:Object.keys(PARAMETERS).length,features:FEATURES.map(f=>({...f,parameterCount:Object.keys(PARAMETERS).filter(a=>f.prefixes.some(p=>a.startsWith(p))).length}))};}
